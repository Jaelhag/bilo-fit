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
  accent, setAccent, glow, setGlow, radius, setRadius, density, setDensity, accentOptions }) {
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

      {/* Backup & sync */}
      <Card>
        <Label icon="link">Backup & sync</Label>
        <p className="muted sm" style={{ marginTop: 8, marginBottom: 12 }}>
          Your data lives on this device. Export a backup to move it to your phone or another computer.
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
        <p className="muted sm" style={{ marginTop: 10 }}>Automatic phone ↔ computer sync — coming next.</p>
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
          Mobility Coach · v0.2 · built on Matthew Smith's Mobility & Flexibility Toolkit
        </p>
      </Card>

      <div className="botpad" />
    </div>
  )
}
