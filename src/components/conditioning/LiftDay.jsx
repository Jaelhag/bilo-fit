import { useState } from 'react'
import { Icon } from '../../lib/icons.jsx'
import { Card, Label, Spark } from '../../lib/charts.jsx'
import { LIFTS, calcE1RM } from '../../data/conditioning.js'

export default function LiftDay({ type, state, update }) {
  const exercises = LIFTS[type] || []
  const [sets, setSets] = useState(() => initSets(exercises))
  const [zone2, setZone2] = useState('')
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)

  const addSet = (exId) => setSets((p) => ({
    ...p, [exId]: [...(p[exId] || []), { weight: '', reps: '', rpe: '' }]
  }))
  const removeSet = (exId, si) => setSets((p) => ({
    ...p, [exId]: p[exId].filter((_, i) => i !== si)
  }))
  const editSet = (exId, si, k, v) => setSets((p) => {
    const next = p[exId].map((s, i) => i === si ? { ...s, [k]: v } : s)
    return { ...p, [exId]: next }
  })

  const save = () => {
    // Build e1RM records for lift progress
    const liftRecords = {}
    exercises.forEach((ex) => {
      const exSets = sets[ex.id] || []
      const best = exSets.reduce((best, s) => {
        const w = parseFloat(s.weight), r = parseInt(s.reps, 10)
        if (!w || !r) return best
        const e1rm = calcE1RM(w, r)
        return e1rm > (best.e1rm || 0) ? { weight: w, reps: r, e1rm } : best
      }, {})
      if (best.e1rm) liftRecords[ex.id] = best
    })

    update((s) => {
      s.conditioningSessions = s.conditioningSessions || []
      s.conditioningSessions.push({
        id: `s_${Math.random().toString(36).slice(2,10)}`,
        type: `${type}-lift`,
        date: new Date().toISOString(),
        data: { sets, zone2Min: zone2 ? parseInt(zone2, 10) : 0 },
        note,
      })
      // Update lift progress
      s.liftProgress = s.liftProgress || {}
      Object.entries(liftRecords).forEach(([exId, rec]) => {
        if (!s.liftProgress[exId]) s.liftProgress[exId] = []
        s.liftProgress[exId].push({ date: new Date().toISOString(), ...rec })
      })
    })
    setSaved(true)
  }

  if (saved) return (
    <Card glow style={{ textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: 40 }}>{type === 'upper' ? '💪' : '🦵'}</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 10 }}>
        {type === 'upper' ? 'Upper day' : 'Lower day'} logged!
      </div>
    </Card>
  )

  return (
    <>
      <Card>
        <Label icon={type === 'upper' ? 'train' : 'bolt'}>
          {type === 'upper' ? 'Upper Body' : 'Lower Body'} · today's lifts
        </Label>
        <p className="muted sm" style={{ marginTop: 6 }}>
          Log your working sets. Tap + to add a set per exercise.
        </p>
      </Card>

      {exercises.map((ex) => (
        <ExerciseCard key={ex.id} ex={ex} sets={sets[ex.id] || []}
          history={state.liftProgress?.[ex.id] || []}
          onAdd={() => addSet(ex.id)}
          onEdit={(si, k, v) => editSet(ex.id, si, k, v)}
          onRemove={(si) => removeSet(ex.id, si)} />
      ))}

      {/* Zone 2 walk */}
      <Card>
        <Label icon="run">Zone 2 walk (after lifting)</Label>
        <div style={{ marginTop: 8 }}>
          <label className="lbl">Minutes walked</label>
          <input className="inp" type="number" min="0" placeholder="e.g. 30"
            value={zone2} onChange={(e) => setZone2(e.target.value)} />
        </div>
      </Card>

      <Card>
        <Label icon="pencil">Session note</Label>
        <textarea className="inp" style={{ marginTop: 8, minHeight: 60, resize: 'none' }}
          placeholder="PRs, how it felt, energy level…"
          value={note} onChange={(e) => setNote(e.target.value)} />
      </Card>

      <div className="sticky-actions">
        <button className="btn primary big" onClick={save}>
          <Icon name="check" size={16} stroke={2.4} /> Save session
        </button>
      </div>
    </>
  )
}

function ExerciseCard({ ex, sets, history, onAdd, onEdit, onRemove }) {
  const [expanded, setExpanded] = useState(!!ex.primary)

  // Latest e1RM from history
  const latestE1RM = history.length ? history[history.length - 1].e1rm : null
  const prev = history.length >= 2 ? history[history.length - 2].e1rm : null
  const trend = latestE1RM && prev ? latestE1RM - prev : null

  // Current session best e1RM
  const curE1RM = sets.reduce((best, s) => {
    const w = parseFloat(s.weight), r = parseInt(s.reps, 10)
    if (!w || !r) return best
    const e = calcE1RM(w, r)
    return e > best ? e : best
  }, 0)

  // e1RM history for spark (last 7 sessions)
  const sparkData = history.slice(-7).map((h) => h.e1rm)
  if (curE1RM && (!sparkData.length || sparkData[sparkData.length - 1] !== curE1RM)) {
    sparkData.push(curE1RM)
  }

  return (
    <div className={`card ${expanded ? 'card-glow' : ''}`} style={{ padding: 0, overflow: 'hidden' }}>
      <button className="drill-head" onClick={() => setExpanded((p) => !p)}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'color-mix(in oklab, var(--accent) 18%, transparent)', border: '1px solid color-mix(in oklab, var(--accent) 35%, transparent)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
          {ex.tag.slice(0,3).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div className="drill-title">{ex.name}</div>
          <div className="muted sm">{ex.scheme}</div>
        </div>
        {latestE1RM && (
          <div style={{ textAlign: 'right', marginRight: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--mono)' }}>{latestE1RM}<span className="u">lb e1RM</span></div>
            {trend !== null && trend !== 0 && (
              <div style={{ fontSize: 11, color: trend > 0 ? '#36e0a8' : '#ff8087', fontFamily: 'var(--mono)' }}>
                {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}
              </div>
            )}
          </div>
        )}
        <span className="chev"><Icon name={expanded ? 'back' : 'chevron'} size={16} stroke={2} style={{ transform: expanded ? 'rotate(90deg)' : 'none' }} /></span>
      </button>

      {expanded && (
        <div className="drill-body">
          {/* Sparkline if history */}
          {sparkData.length >= 2 && (
            <div>
              <div className="muted sm" style={{ marginBottom: 4 }}>e1RM trend</div>
              <Spark data={sparkData} w={300} h={40} fill dots />
            </div>
          )}

          {/* Set rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sets.map((s, si) => (
              <SetInputRow key={si} set={s} idx={si} ex={ex}
                onChange={(k,v) => onEdit(si, k, v)}
                onRemove={() => onRemove(si)} />
            ))}
          </div>

          <button className="btn" style={{ marginTop: 4 }} onClick={onAdd}>
            + Add set
          </button>

          {/* Current e1RM estimate */}
          {curE1RM > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Icon name="trend" size={14} className="stat-i" />
              <span className="muted sm">Today's e1RM estimate: </span>
              <strong style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>{curE1RM} lb</strong>
              {latestE1RM && curE1RM > latestE1RM && (
                <span style={{ color: '#36e0a8', fontSize: 12, fontWeight: 700 }}>
                  ▲ {curE1RM - latestE1RM} PR!
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SetInputRow({ set, idx, ex, onChange, onRemove }) {
  const w = parseFloat(set.weight), r = parseInt(set.reps, 10)
  const e1rm = w && r ? calcE1RM(w, r) : null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 1fr auto', gap: 6, alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', fontFamily: 'var(--mono)' }}>{idx + 1}</span>
      <div>
        <label className="lbl">Weight (lb)</label>
        <input className="inp" type="number" placeholder="225"
          value={set.weight} onChange={(e) => onChange('weight', e.target.value)} />
      </div>
      <div>
        <label className="lbl">Reps</label>
        <input className="inp" type="number" placeholder="5"
          value={set.reps} onChange={(e) => onChange('reps', e.target.value)} />
      </div>
      <div>
        <label className="lbl">RPE</label>
        <input className="inp" type="text" placeholder="7–9"
          value={set.rpe} onChange={(e) => onChange('rpe', e.target.value)} />
      </div>
      <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', paddingTop: 16 }}>
        <Icon name="x" size={14} stroke={2} />
      </button>
      {e1rm && (
        <span style={{ gridColumn: '2 / -1', fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>
          e1RM ~{e1rm} lb
        </span>
      )}
    </div>
  )
}

function initSets(exercises) {
  const out = {}
  exercises.filter((e) => e.primary).forEach((e) => {
    out[e.id] = [{ weight: '', reps: '', rpe: '' }]
  })
  return out
}
