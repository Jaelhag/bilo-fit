import { Icon } from '../lib/icons.jsx'
import { Card, Label } from '../lib/charts.jsx'

const SORE = [
  { v: 1, label: 'Barely sore' },
  { v: 2, label: '2–3 days' },
  { v: 4, label: '4+ days' },
]
const rpe = (n) => ({ 2: 'easy', 4: 'light', 6: 'moderate', 8: 'hard', 10: 'max' }[n] || '')

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) }
  catch { return iso }
}

const TYPE_LABELS = {
  explosive: '⚡ Explosive Day', 'upper-lift': '💪 Upper Lift', 'lower-lift': '🦵 Lower Lift',
  'echo-bike': '🚴 Echo Bike', zone2: '🚶 Zone 2', mobility: '🤸 Mobility',
}

export default function History({ state, update }) {
  const [tab, setTab] = useState('all')
  const mobSessions = [...state.sessions].map((s) => ({ ...s, _kind: 'mobility' }))
  const condSessions = [...(state.conditioningSessions || [])].map((s) => ({ ...s, _kind: 'conditioning' }))
  const all = [...mobSessions, ...condSessions].sort((a,b) => new Date(b.date) - new Date(a.date))
  const sessions = tab === 'all' ? all : tab === 'mobility' ? mobSessions : condSessions

  const setSore = (id, soreDays) =>
    update((s) => {
      const sess = s.sessions.find((x) => x.id === id)
      if (sess) sess.soreDays = soreDays
    })

  return (
    <div className="screen">
      <header className="hd">
        <div>
          <div className="hd-hi">History</div>
          <div className="hd-sub mono">{all.length} SESSIONS LOGGED</div>
        </div>
      </header>
      <div className="seg">
        {['all','mobility','conditioning'].map((t) => (
          <button key={t} className={`seg-b ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {!sessions.length && (
        <Card>
          <Label icon="history">No sessions yet</Label>
          <p className="muted sm" style={{ marginTop: 8 }}>
            Train a session and it'll show up here. You'll be able to log how sore you were — that tunes your recovery timing.
          </p>
        </Card>
      )}

      {sessions.map((s) => (
        <Card key={s.id}>
          <div className="row-between">
            <div>
              <Label>
                {s._kind === 'conditioning'
                  ? (TYPE_LABELS[s.type] || `🏋️ ${s.type}`)
                  : `${goalEmoji(s.goalId)} ${goalLabel(s.goalId)}`}
              </Label>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{fmtDate(s.date)}</div>
            </div>
            {s._kind === 'conditioning' && s.type === 'echo-bike' && s.data?.hrMax && (
              <span className="badge">HR max {s.data.hrMax}</span>
            )}
            {s._kind === 'mobility' && <span className="badge">{s.drills?.length} drills</span>}
          </div>

          {/* Mobility drills */}
          {s._kind === 'mobility' && s.drills && (
            <ul className="hist-drills">
              {s.drills.map((d) => (
                <li key={d.drillId}>
                  <span>{d.name}</span>
                  <span className="muted sm mono">
                    {[d.setsDone ? `${d.setsDone} sets` : null, d.load || null, d.rpe ? rpe(d.rpe) : null].filter(Boolean).join(' · ')}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Echo bike summary */}
          {s.type === 'echo-bike' && s.data && (
            <div className="muted sm" style={{ marginTop: 8 }}>
              {s.data.protocol} · {s.data.duration} · HR avg {s.data.hrAvg} · HR max {s.data.hrMax}
              {s.data.intervalLogs && (
                <span> · Peak watts {Math.max(...s.data.intervalLogs.map((l) => parseInt(l.wattsHigh,10)||0)) || '—'}</span>
              )}
            </div>
          )}

          {/* Explosive day */}
          {s.type === 'explosive' && s.data?.sprintWork && (
            <div className="muted sm" style={{ marginTop: 8 }}>
              {s.data.sprintWork.map((w) => `${w.sets}× ${w.workType?.replace(/-/g,' ')}`).join(' · ')}
            </div>
          )}

          {/* Lift summary — object-keyed (structured) or array (quick-logged) */}
          {(s.type === 'upper-lift' || s.type === 'lower-lift') && s.data?.sets && (
            <div className="muted sm" style={{ marginTop: 8 }}>
              {Object.entries(s.data.sets).filter(([,v])=>v.length).map(([k,v]) => `${k.replace(/-/g,' ')} ${v.length} sets`).join(' · ')}
              {s.data.zone2Min ? ` · ${s.data.zone2Min} min Z2` : ''}
            </div>
          )}
          {s.data?.exercises && s.data.exercises.length > 0 && (
            <ul className="hist-drills" style={{ marginTop: 8 }}>
              {s.data.exercises.map((ex, i) => (
                <li key={i}>
                  <span>{ex.name}</span>
                  <span className="muted sm mono">{(ex.sets||[]).map((st)=>`${st.weight||''}${st.weight&&st.reps?'×':''}${st.reps||''}`).filter(Boolean).join(', ')}</span>
                </li>
              ))}
              {s.data.zone2Min ? <li><span className="muted sm">Zone 2</span><span className="muted sm mono">{s.data.zone2Min} min</span></li> : null}
            </ul>
          )}

          {/* Zone 2 */}
          {s.type === 'zone2' && (
            <div className="muted sm" style={{ marginTop: 8 }}>{s.data?.zone2Min} min Zone 2</div>
          )}

          {s.note && <div style={{ marginTop: 8, fontSize: 13, color: '#b0bde8', fontStyle: 'italic' }}>{s.note}</div>}

          {/* Soreness (mobility sessions only) */}
          {s._kind === 'mobility' && (
            <div className="sore">
              <div className="lbl">How sore were you the next day or two?</div>
              <div className="opts tight" style={{ marginTop: 6 }}>
                {SORE.map((o) => (
                  <button key={o.v} className={`opt sm ${s.soreDays === o.v ? 'sel' : ''}`}
                    onClick={() => setSore(s.id, o.v)}>{o.label}</button>
                ))}
              </div>
              {s.soreDays && (
                <div className="check-ok" style={{ marginTop: 8 }}>
                  <Icon name="check" size={13} stroke={2.6} /> Logged
                </div>
              )}
            </div>
          )}
        </Card>
      ))}

      <div className="botpad" />
    </div>
  )
}

function goalLabel(id) {
  const map = {
    'side-split': 'Side Split', 'pancake': 'Pancake', 'front-split': 'Front Split',
    'pike': 'Pike', 'shoulder': 'Shoulder', 'bridge': 'Bridge',
  }
  return map[id] || id.replace('-', ' ')
}
function goalEmoji(id) {
  const map = { 'side-split': '🦵', 'pancake': '🥞', 'front-split': '🤸', 'pike': '🙇', 'shoulder': '💪', 'bridge': '🌉' }
  return map[id] || '🎯'
}
