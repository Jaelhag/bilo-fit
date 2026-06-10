import { useState } from 'react'
import { Icon } from '../../lib/icons.jsx'
import { Card, Label, DateField, todayStr, dateToISO } from '../../lib/charts.jsx'
import { SPRINT_WARMUP, SPRINT_WORK } from '../../data/conditioning.js'

export default function ExplosiveDay({ state, update, goTo }) {
  // Warm-up checklist
  const allItems = SPRINT_WARMUP.flatMap((s) => s.items.map((it) => it.id))
  const [checked, setChecked] = useState(new Set())
  const [workSets, setWorkSets] = useState([defaultWorkSet()])
  const [saved, setSaved] = useState(false)
  const [note, setNote] = useState('')
  const [logDate, setLogDate] = useState(todayStr())

  const toggle = (id) => setChecked((prev) => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const addWork = () => setWorkSets((p) => [...p, defaultWorkSet()])
  const editWork = (i, k, v) => setWorkSets((p) => p.map((w, idx) => idx === i ? { ...w, [k]: v } : w))
  const removeWork = (i) => setWorkSets((p) => p.filter((_, idx) => idx !== i))

  const save = () => {
    update((s) => {
      s.conditioningSessions = s.conditioningSessions || []
      s.conditioningSessions.push({
        id: `s_${Math.random().toString(36).slice(2,10)}`,
        type: 'explosive',
        date: dateToISO(logDate),
        data: {
          warmupChecked: [...checked],
          sprintWork: workSets,
        },
        note,
      })
    })
    setSaved(true)
  }

  // Recent explosive sessions
  const recent = [...(state.conditioningSessions || [])]
    .filter((s) => s.type === 'explosive')
    .sort((a,b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3)

  if (saved) return (
    <Card glow style={{ textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: 40 }}>⚡</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 10 }}>Explosive day logged!</div>
      <p className="muted sm" style={{ marginTop: 6 }}>{workSets.length} sprint sets recorded.</p>
    </Card>
  )

  return (
    <>
      <Card><DateField value={logDate} onChange={setLogDate} label="Workout date" /></Card>

      {/* Warm-up checklist */}
      {SPRINT_WARMUP.map((section) => (
        <Card key={section.section}>
          <Label icon="bolt">{section.section}{section.note ? ` — ${section.note}` : ''}</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {section.items.map((item) => (
              <button key={item.id}
                onClick={() => toggle(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  border: `1px solid ${checked.has(item.id) ? 'var(--accent)' : 'var(--line)'}`,
                  borderRadius: 10, background: checked.has(item.id) ? 'color-mix(in oklab, var(--accent) 12%, transparent)' : 'var(--panel2)',
                  color: 'var(--txt)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  transition: '.15s',
                }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${checked.has(item.id) ? 'var(--accent)' : 'var(--line2)'}`,
                  background: checked.has(item.id) ? 'var(--accent)' : 'transparent',
                  display: 'grid', placeItems: 'center', flexShrink: 0, color: '#fff',
                }}>
                  {checked.has(item.id) && <Icon name="check" size={11} stroke={3} />}
                </div>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</span>
                {item.detail && <span className="muted sm">{item.detail}</span>}
              </button>
            ))}
          </div>
          {section.items.length > 0 && (
            <div className="muted sm" style={{ marginTop: 8, fontFamily: 'var(--mono)' }}>
              {section.items.filter((i) => checked.has(i.id)).length} / {section.items.length} done
            </div>
          )}
        </Card>
      ))}

      {/* Sprint work */}
      <Card glow>
        <div className="row-between" style={{ marginBottom: 12 }}>
          <Label icon="bolt">Sprint work</Label>
          <button className="link" onClick={addWork}>+ Add set</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {workSets.map((w, i) => (
            <SprintSetRow key={i} row={w} idx={i} onChange={(k,v) => editWork(i,k,v)} onRemove={() => removeWork(i)} />
          ))}
        </div>
      </Card>

      {/* Notes */}
      <Card>
        <Label icon="pencil">Session note</Label>
        <textarea className="inp" style={{ marginTop: 8, minHeight: 72, resize: 'none' }}
          placeholder="How did it feel? Any PRs, conditions, partners…"
          value={note} onChange={(e) => setNote(e.target.value)} />
      </Card>

      {/* Recent */}
      {recent.length > 0 && (
        <Card>
          <Label icon="history">Recent explosive days</Label>
          <div className="listy">
            {recent.map((s) => (
              <div key={s.id} className="listy-row">
                <span>{fmtDate(s.date)}</span>
                <span className="muted sm">
                  {s.data?.sprintWork?.map((w) => `${w.sets}×${w.name || w.workType}`).join(', ')}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="sticky-actions">
        <button className="btn primary big" onClick={save}>
          <Icon name="check" size={16} stroke={2.4} /> Save session
        </button>
      </div>
    </>
  )
}

function SprintSetRow({ row, idx, onChange, onRemove }) {
  return (
    <div style={{ background: 'var(--panel2)', border: '1px solid var(--line)', borderRadius: 12, padding: 12 }}>
      <div className="row-between" style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Set {idx + 1}</span>
        <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }}
          onClick={onRemove}><Icon name="x" size={14} stroke={2} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label className="lbl">Type</label>
          <select className="inp" style={{ appearance: 'none' }}
            value={row.workType} onChange={(e) => onChange('workType', e.target.value)}>
            {SPRINT_WORK.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div>
          <label className="lbl">Sets / reps</label>
          <input className="inp" type="text" placeholder="e.g. 3"
            value={row.sets} onChange={(e) => onChange('sets', e.target.value)} />
        </div>
        <div>
          <label className="lbl">RPE / effort</label>
          <input className="inp" type="text" placeholder="e.g. 7.5–8"
            value={row.rpe} onChange={(e) => onChange('rpe', e.target.value)} />
        </div>
        <div>
          <label className="lbl">Recovery</label>
          <input className="inp" type="text" placeholder="e.g. walk down"
            value={row.recovery} onChange={(e) => onChange('recovery', e.target.value)} />
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        <label className="lbl">Note (optional)</label>
        <input className="inp" type="text" placeholder="e.g. fastest rep 7.42s"
          value={row.note || ''} onChange={(e) => onChange('note', e.target.value)} />
      </div>
    </div>
  )
}

function defaultWorkSet() {
  return { workType: 'hill-10s', sets: '3', rpe: '7.5–8', recovery: 'Walk down', note: '' }
}

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) }
  catch { return iso }
}
