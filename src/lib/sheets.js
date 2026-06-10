// =============================================================================
//  GOOGLE SHEETS SYNC (one-way: app → your Google Sheet)
//  The app POSTs its full state to a Google Apps Script "web app" endpoint the
//  user deploys on their own Bilo Fit Data sheet. The script organizes the data
//  into tabs (Workouts, Blood Pressure, Sleep, Weight, Medications, Strength…).
//
//  We POST as a "simple" text/plain request in no-cors mode so the browser
//  doesn't need CORS preflight (Apps Script web apps don't answer preflight).
//  Trade-off: we can't read the response, so this is fire-and-forget.
// =============================================================================

import { useEffect, useRef, useState } from 'react'

const URL_KEY  = 'mc-sheets-url'
const AUTO_KEY = 'mc-sheets-auto'
const LAST_KEY = 'mc-sheets-last'

export function useSheetsSync(state) {
  const [url, setUrlState]   = useState(() => localStorage.getItem(URL_KEY) || '')
  const [auto, setAutoState] = useState(() => localStorage.getItem(AUTO_KEY) === '1')
  const [lastPush, setLast]  = useState(() => localStorage.getItem(LAST_KEY) || null)
  const [busy, setBusy]      = useState(false)
  const [error, setError]    = useState(null)

  const stateRef = useRef(state)
  stateRef.current = state
  const timer = useRef(null)

  const setUrl = (u) => {
    const v = (u || '').trim()
    setUrlState(v)
    if (v) localStorage.setItem(URL_KEY, v); else localStorage.removeItem(URL_KEY)
  }
  const setAuto = (v) => {
    setAutoState(v)
    localStorage.setItem(AUTO_KEY, v ? '1' : '0')
  }

  async function push() {
    const u = localStorage.getItem(URL_KEY)
    if (!u) return
    setBusy(true); setError(null)
    try {
      await fetch(u, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(stateRef.current),
      })
      const now = new Date().toISOString()
      localStorage.setItem(LAST_KEY, now)
      setLast(now)
    } catch (e) {
      setError('Push failed — check the web-app URL.')
    } finally {
      setBusy(false)
    }
  }

  // Debounced auto-push when enabled and connected.
  useEffect(() => {
    if (!auto || !url) return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => { push() }, 4000)
    return () => clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, auto, url])

  return { url, setUrl, auto, setAuto, lastPush, busy, error, push, connected: !!url }
}
