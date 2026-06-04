import { useRef, useState } from 'react'
import { Icon } from '../lib/icons.jsx'
import { Card, Label } from '../lib/charts.jsx'
import { exportFile, importFile } from '../lib/storage.js'
import { COURSE_BASE } from '../data/library.js'

const ACCENTS = [
  { hex: '#2f6bff', label: 'Electric Blue' },
  { hex: '#19b6ff', label: 'Sky' },
  { hex: '#00e0ff', label: 'Cyan' },
  { hex: '#5b6bff', label: 'Indigo' },
  { hex: '#19e6c0', label: 'Mint' },
]

export default function More({ state, update,
  accent, setAccent, glow, setGlow, radius, setRadius, density, setDensity, accentOptions, sync }) {
  const fileRef = useRef(null)
  const [msg, setMsg]     = useState('')

  const onImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = await importFile(file)
      update((s) => { Object.assign(s, data) })
      setMsg('Restored ✓')
    } catch (err) { setMsg('Could not read file: ' + err.message) }
    e.target.value = ''
  }

  return (
    <div className="screen">
      <header className="hd"><div className="hd-hi">More</div></header>

      {/* Profile */}
      <Card>
        <Label icon="bolt">You</Label>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label className="lbl">Name</label>
            <input className="inp" value={state.profile.name || ''}
              placeholder="Your name"
              onChange={(e) => update((s) => { s.profile.name = e.target.value })} />
          </div>
          <div>
            <div className="lbl">Days per week you'll train</div>
            <div className="opts tight" style={{ marginTop: 6 }}>
              {[1,2,3,4].map((n) => (
                <button key={n}
                  className={`opt sm ${(state.profile.weeklyTarget || 1) === n ? 'sel' : ''}`}
                  onClick={() => update((s) => { s.profile.weeklyTarget = n })}>
                  {n}×
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card>
        <Label icon="sun">Appearance</Label>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="lbl">Accent colour</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              {ACCENTS.map(({ hex, label }) => (
                <button key={hex}
                  onClick={() => setAccent(hex)}
                  title={label}
                  style={{
                    width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: hex, flexShrink: 0,
                    outline: accent === hex ? `2px solid ${hex}` : '2px solid transparent',
                    outlineOffset: 3,
                    boxShadow: accent === hex ? `0 0 12px ${hex}88` : 'none',
                  }} />
              ))}
            </div>
          </div>

          <div>
            <div className="lbl" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Glow intensity</span><span className="mono">{glow}</span>
            </div>
            <input type="range" min={0} max={2} step={0.1} value={glow}
              onChange={(e) => setGlow(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)', marginTop: 6 }} />
          </div>

          <div>
            <div className="lbl" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Corner radius</span><span className="mono">{radius}px</span>
            </div>
            <input type="range" min={6} max={28} step={1} value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)', marginTop: 6 }} />
          </div>

          <div>
            <div className="lbl">Density</div>
            <div className="seg" style={{ marginTop: 6 }}>
              {['compact', 'regular', 'comfy'].map((d) => (
                <button key={d} className={`seg-b ${density === d ? 'on' : ''}`}
                  onClick={() => setDensity(d)}>{d}</button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Cloud sync */}
      <CloudSyncCard sync={sync} />

      {/* Backup & sync */}
      <Card>
        <Label icon="link">Manual backup</Label>
        <p className="muted sm" style={{ marginTop: 8, marginBottom: 12 }}>
          Export a one-off backup file (a snapshot you control), separate from cloud sync.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" style={{ flex: 1 }} onClick={() => exportFile(state)}>
            <Icon name="send" size={14} stroke={2} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Export backup
          </button>
          <button className="btn ghost" style={{ flex: 1 }} onClick={() => fileRef.current?.click()}>
            Restore backup
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImport} />
        {msg && <div className="check-ok" style={{ marginTop: 8 }}><Icon name="check" size={13} stroke={2.6} /> {msg}</div>}
      </Card>

      {/* The course */}
      <Card>
        <Label icon="goals">The course</Label>
        <p className="muted sm" style={{ marginTop: 8 }}>
          This app handles personalized programming and session tracking. For drill form and video, it links into the Mobility & Flexibility Toolkit.
        </p>
        <a className="link" href={COURSE_BASE} target="_blank" rel="noreferrer" style={{ marginTop: 10, display: 'inline-block' }}>
          Open the Toolkit ↗
        </a>
      </Card>

      <Card>
        <p className="muted sm" style={{ textAlign: 'center' }}>
          Mobility Coach · v0.3 · built on Matthew Smith's Mobility & Flexibility Toolkit
        </p>
      </Card>

      <div className="botpad" />
    </div>
  )
}

// ---- Cloud sync card ----
const TOKEN_URL = 'https://github.com/settings/tokens/new?scopes=gist&description=Mobility%20Coach%20Sync'

function CloudSyncCard({ sync }) {
  const [token, setToken] = useState('')
  const [open, setOpen]   = useState(false)
  const [flash, setFlash] = useState('')

  if (!sync) return null
  const { status, connect, push, pull, disconnect } = sync

  const doConnect = async () => {
    const res = await connect(token.trim())
    if (res.ok) {
      setToken(''); setOpen(false)
      setFlash(res.pulled ? 'Connected — pulled your data from the cloud ✓' : 'Connected — this device is now syncing ✓')
      setTimeout(() => setFlash(''), 4000)
    }
  }

  return (
    <Card glow={status.connected}>
      <div className="row-between">
        <Label icon="link">Cloud sync</Label>
        {status.connected && (
          <span className="badge ok" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {status.busy ? <span className="spin" style={{ width: 10, height: 10, borderWidth: 1.5 }} /> : '●'} synced
          </span>
        )}
      </div>

      {status.connected ? (
        <>
          <p className="muted sm" style={{ marginTop: 8 }}>
            Syncing as <strong style={{ color: 'var(--txt)' }}>{status.login}</strong> via a private GitHub gist.
            {status.lastSync && <> Last synced {fmtAgo(status.lastSync)}.</>}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn" style={{ flex: 1 }} disabled={status.busy} onClick={() => pull()}>
              <Icon name="back" size={14} stroke={2} style={{ marginRight: 6, verticalAlign: 'middle', transform: 'rotate(90deg)' }} />
              Pull latest
            </button>
            <button className="btn" style={{ flex: 1 }} disabled={status.busy} onClick={() => push()}>
              <Icon name="send" size={14} stroke={2} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Push now
            </button>
          </div>
          <button className="link" style={{ marginTop: 10, color: '#ff8087' }}
            onClick={() => { if (window.confirm('Disconnect cloud sync on this device? Your data stays on the device and in the cloud.')) disconnect() }}>
            Disconnect this device
          </button>
          {flash && <div className="check-ok" style={{ marginTop: 8 }}><Icon name="check" size={13} stroke={2.6} /> {flash}</div>}
          {status.error && <div className="ql-err" style={{ marginTop: 8 }}>{status.error}</div>}
        </>
      ) : (
        <>
          <p className="muted sm" style={{ marginTop: 8 }}>
            Keep your phone and computer in sync automatically — through a <strong style={{ color: 'var(--txt)' }}>private</strong> locker in your own GitHub account. No new account, free, and only you can see it.
          </p>

          {!open ? (
            <button className="btn primary big" style={{ marginTop: 12 }} onClick={() => setOpen(true)}>
              <Icon name="link" size={16} stroke={2} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Turn on sync
            </button>
          ) : (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ background: 'var(--panel2)', border: '1px solid var(--line)', borderRadius: 12, padding: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>One-time setup (≈2 min):</div>
                <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
                  <li>Tap <a className="link" href={TOKEN_URL} target="_blank" rel="noreferrer">this link</a> (opens GitHub). The “gist” box is already ticked.</li>
                  <li>Scroll down, tap <strong style={{ color: 'var(--txt)' }}>Generate token</strong>.</li>
                  <li>Copy the token it shows you, and paste it below.</li>
                </ol>
              </div>
              <input className="inp" type="password" placeholder="Paste your GitHub token here"
                value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn primary" style={{ flex: 1 }} disabled={!token.trim() || status.busy} onClick={doConnect}>
                  {status.busy ? <><span className="spin" /> Connecting…</> : 'Connect'}
                </button>
                <button className="btn ghost" onClick={() => { setOpen(false); setToken('') }}>Cancel</button>
              </div>
              {status.error && <div className="ql-err">{status.error}</div>}
              <p className="muted sm">On your other device, do the same and paste the same token — it'll pull your data automatically.</p>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

function fmtAgo(iso) {
  try {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s/60)}m ago`
    if (s < 86400) return `${Math.floor(s/3600)}h ago`
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch { return '' }
}
