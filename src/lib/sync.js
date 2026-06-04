// =============================================================================
//  CLOUD SYNC — via a private GitHub Gist
//  Uses the user's own GitHub account (no new service / account). The app stores
//  its entire state as a single private gist file and keeps devices in sync with
//  last-write-wins based on settings.updatedAt.
//
//  The token is the user's GitHub personal access token (classic) with ONLY the
//  `gist` scope. It is stored in localStorage on the device and never sent
//  anywhere except api.github.com over HTTPS.
// =============================================================================

import { useEffect, useRef, useState } from 'react'
import { hydrate } from './storage.js'

const API = 'https://api.github.com'
const FILENAME = 'mobility-coach-data.json'
const GIST_DESC = 'Mobility Coach — synced data (private)'

const TOKEN_KEY = 'mc-sync-token'
const GIST_KEY  = 'mc-sync-gist'
const LOGIN_KEY = 'mc-sync-login'
const LAST_KEY  = 'mc-sync-last'

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

// Validate token → returns the GitHub login.
async function whoami(token) {
  const r = await fetch(`${API}/user`, { headers: headers(token) })
  if (r.status === 401) throw new Error('That token was rejected. Check you copied it fully and gave it the "gist" scope.')
  if (!r.ok) throw new Error(`GitHub error (${r.status}). Try again in a moment.`)
  const u = await r.json()
  return u.login
}

// Find our existing data gist, if any.
async function findGist(token) {
  const r = await fetch(`${API}/gists?per_page=100`, { headers: headers(token) })
  if (!r.ok) throw new Error(`Couldn't list gists (${r.status}).`)
  const gists = await r.json()
  const found = gists.find((g) => g.files && g.files[FILENAME])
  return found ? found.id : null
}

async function createGist(token, state) {
  const r = await fetch(`${API}/gists`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      description: GIST_DESC,
      public: false,
      files: { [FILENAME]: { content: JSON.stringify(state) } },
    }),
  })
  if (!r.ok) throw new Error(`Couldn't create the sync gist (${r.status}).`)
  const g = await r.json()
  return g.id
}

async function pushGist(token, gistId, state) {
  const r = await fetch(`${API}/gists/${gistId}`, {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify({ files: { [FILENAME]: { content: JSON.stringify(state) } } }),
  })
  if (!r.ok) throw new Error(`Push failed (${r.status}).`)
  return true
}

async function pullGist(token, gistId) {
  const r = await fetch(`${API}/gists/${gistId}`, { headers: headers(token) })
  if (!r.ok) throw new Error(`Pull failed (${r.status}).`)
  const g = await r.json()
  const file = g.files?.[FILENAME]
  if (!file) return null
  // Large gists are truncated — fetch raw_url if so.
  let content = file.content
  if (file.truncated && file.raw_url) {
    const rr = await fetch(file.raw_url)
    content = await rr.text()
  }
  try { return JSON.parse(content) } catch { return null }
}

function ts(state) {
  return state?.settings?.updatedAt ? new Date(state.settings.updatedAt).getTime() : 0
}

// ---- React hook ----
export function useCloudSync(state, replaceState) {
  const [status, setStatus] = useState(() => ({
    connected: !!localStorage.getItem(TOKEN_KEY),
    login:    localStorage.getItem(LOGIN_KEY) || null,
    gistId:   localStorage.getItem(GIST_KEY) || null,
    lastSync: localStorage.getItem(LAST_KEY) || null,
    busy: false,
    error: null,
  }))

  const pushTimer = useRef(null)
  const skipPush  = useRef(false)
  const stateRef  = useRef(state)
  stateRef.current = state

  const markSynced = () => {
    const now = new Date().toISOString()
    localStorage.setItem(LAST_KEY, now)
    setStatus((s) => ({ ...s, lastSync: now, busy: false, error: null }))
  }

  // Initial pull on mount when already connected.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const gistId = localStorage.getItem(GIST_KEY)
    if (token && gistId) { doPull(token, gistId, /*silent*/ true) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced auto-push whenever state changes (and we're connected).
  useEffect(() => {
    if (!status.connected || !status.gistId) return
    if (skipPush.current) { skipPush.current = false; return }
    clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => { doPush() }, 2500)
    return () => clearTimeout(pushTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, status.connected, status.gistId])

  async function connect(token) {
    setStatus((s) => ({ ...s, busy: true, error: null }))
    try {
      const login = await whoami(token)
      let gistId = await findGist(token)
      let pulled = false
      if (gistId) {
        // Existing data in the cloud — pull it (this is likely a 2nd device).
        const cloud = await pullGist(token, gistId)
        if (cloud && ts(cloud) >= ts(stateRef.current)) {
          skipPush.current = true
          replaceState(hydrate(cloud))
          pulled = true
        } else {
          await pushGist(token, gistId, stateRef.current)
        }
      } else {
        gistId = await createGist(token, stateRef.current)
      }
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(GIST_KEY, gistId)
      localStorage.setItem(LOGIN_KEY, login)
      const now = new Date().toISOString()
      localStorage.setItem(LAST_KEY, now)
      setStatus({ connected: true, login, gistId, lastSync: now, busy: false, error: null })
      return { ok: true, pulled, login }
    } catch (e) {
      setStatus((s) => ({ ...s, busy: false, error: e.message }))
      return { ok: false, error: e.message }
    }
  }

  async function doPush() {
    const token = localStorage.getItem(TOKEN_KEY)
    const gistId = localStorage.getItem(GIST_KEY)
    if (!token || !gistId) return
    setStatus((s) => ({ ...s, busy: true }))
    try {
      await pushGist(token, gistId, stateRef.current)
      markSynced()
    } catch (e) {
      setStatus((s) => ({ ...s, busy: false, error: e.message }))
    }
  }

  async function doPull(tokenArg, gistArg, silent = false) {
    const token = tokenArg || localStorage.getItem(TOKEN_KEY)
    const gistId = gistArg || localStorage.getItem(GIST_KEY)
    if (!token || !gistId) return
    setStatus((s) => ({ ...s, busy: true }))
    try {
      const cloud = await pullGist(token, gistId)
      if (cloud && ts(cloud) > ts(stateRef.current)) {
        skipPush.current = true
        replaceState(hydrate(cloud))
      }
      markSynced()
    } catch (e) {
      setStatus((s) => ({ ...s, busy: false, error: silent ? null : e.message }))
    }
  }

  function disconnect() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(GIST_KEY)
    localStorage.removeItem(LOGIN_KEY)
    localStorage.removeItem(LAST_KEY)
    setStatus({ connected: false, login: null, gistId: null, lastSync: null, busy: false, error: null })
  }

  return { status, connect, push: doPush, pull: doPull, disconnect }
}
