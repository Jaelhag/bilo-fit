import { useState } from 'react'
import { Icon } from '../lib/icons.jsx'
import { DateField, todayStr, dateToISO } from '../lib/charts.jsx'
import { guessType, parseWorkout, SESSION_TYPES } from '../lib/parse.js'
import { calcE1RM } from '../data/conditioning.js'

export default function QuickLog({ onClose, update }) {
  const [phase, setPhase] = useState('input')   // input | review | saved
  const [notes, setNotes] = useState('')
  const [session, setSession] = useState(null)
  const [logDate, setLogDate] = useState(todayStr())

  function runParse() {
    const type = guessType(notes)
    const parsed = parseWorkout(notes, type)
    // If the text had a date line we recognized, prefer it
    if (parsed.dateGuess) {
      const d = new Date(parsed.dateGuess)
      if (!isNaN(d)) {
        const off = d.getTimezoneOffset() * 60000
        setLogDate(new Date(d - off).toISOString().slice(0, 10))
      }
    }
    setSession(parsed)
    setPhase('review')
  }

  function setType(t) {
    // Re-parse with the chosen type (keeps your edits to text, re-derives structure only on first parse)
    setSession((s) => ({ ...s, sessionType: t, title: TITLE[t] || s.title }))
  }

  // ---- editing the parsed result ----
  const editEx = (ei, patch) => setSession((s) => {
    const ex = s.exercises.map((e, i) => i === ei ? { ...e, ...patch } : e)
    return { ...s, exercises: ex }
  })
  const editSet = (ei, si, k, v) => setSession((s) => {
    const ex = s.exercises.map((e, i) => {
      if (i !== ei) return e
      const sets = e.sets.map((st, j) => j === si ? { ...st, [k]: v } : st)
      return { ...e, sets }
    })
    return { ...s, exercises: ex }
  })
  const addSet = (ei) => setSession((s) => {
    const ex = s.exercises.map((e, i) => i === ei ? { ...e, sets: [...e.sets, { weight: '', reps: '' }] } : e)
    return { ...s, exercises: ex }
  })
  const delEx = (ei) => setSession((s) => ({ ...s, exercises: s.exercises.filter((_, i) => i !== ei) }))
  const addEx = () => setSession((s) => ({ ...s, exercises: [...s.exercises, { name: '', sets: [{ weight: '', reps: '' }], note: '' }] }))

  function save() {
    const isLift = session.sessionType === 'upper-lift' || session.sessionType === 'lower-lift'
    update((s) => {
      s.conditioningSessions = s.conditioningSessions || []
      s.conditioningSessions.push({
        id: `s_${Math.random().toString(36).slice(2, 10)}`,
        type: session.sessionType,
        date: dateToISO(logDate),
        data: {
          exercises: session.exercises,
          zone2Min: session.zone2Min ? parseInt(session.zone2Min, 10) : 0,
        },
        note: session.note || '',
      })
      if (isLift) {
        s.liftProgress = s.liftProgress || {}
        session.exercises.forEach((ex) => {
          let best = null
          ;(ex.sets || []).forEach((st) => {
            const w = parseFloat(st.weight), r = parseInt(st.reps, 10)
            if (w && r) { const e = calcE1RM(w, r); if (!best || e > best.e1rm) best = { weight: w, reps: r, e1rm: e } }
          })
          if (best && ex.name.trim()) {
            const key = ex.name.trim()
            if (!s.liftProgress[key]) s.liftProgress[key] = []
            s.liftProgress[key].push({ date: dateToISO(logDate), ...best })
          }
        })
      }
    })
    setPhase('saved')
    setTimeout(onClose, 1200)
  }

  return (
    <div className="ql-wrap" onClick={onClose}>
      <div className="ql" onClick={(e) => e.stopPropagation()}>
        <div className="ql-head">
          <div className="ql-title">{phase === 'review' ? 'Review & save' : 'Quick log'}</div>
          <button className="ql-x" onClick={onClose}><Icon name="x" size={18} stroke={2.2} /></button>
        </div>

        {phase === 'saved' && (
          <div className="ql-saved">
            <div className="ql-saved-i"><Icon name="check" size={28} stroke={2.6} /></div>
            Saved to your log
          </div>
        )}

        {phase === 'input' && (
          <div className="ql-body">
            <textarea className="ql-ta" autoFocus
              placeholder={"Paste or type your workout, however you write it…\n\nPulldown: 50x10, 90x10, 120x10, 150x10\nDbell row - 110x9\nIncline dbell - 25x5, 35x5, 45x5\nAssisted dip - 110x9, 7\ntreadmill walk 30 min"}
              value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div className="ql-hint">It reads your sets (e.g. <b>150x10</b>), splits out notes, and you'll confirm everything before saving.</div>
            <button className="ql-go" disabled={!notes.trim()} onClick={runParse}>
              <Icon name="spark" size={16} /> Read my notes
            </button>
          </div>
        )}

        {phase === 'review' && session && (
          <>
            <div className="ql-review">
              {/* Type picker */}
              <div className="lbl">Session type</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                {SESSION_TYPES.map((t) => (
                  <button key={t.id}
                    onClick={() => setType(t.id)}
                    style={{
                      padding: '8px 4px', borderRadius: 9, fontFamily: 'inherit', fontSize: 12, cursor: 'pointer',
                      border: `1px solid ${session.sessionType === t.id ? 'var(--accent)' : 'var(--line)'}`,
                      background: session.sessionType === t.id ? 'color-mix(in oklab, var(--accent) 18%, transparent)' : 'var(--panel2)',
                      color: session.sessionType === t.id ? '#fff' : 'var(--muted)', fontWeight: 600,
                    }}>
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 4 }}><DateField value={logDate} onChange={setLogDate} label="Date" /></div>

              {/* Exercises */}
              {session.exercises.length > 0 && (
                <div className="lbl" style={{ marginTop: 4 }}>{session.exercises.length} exercises detected</div>
              )}
              {session.exercises.map((ex, ei) => (
                <div className="ql-ex" key={ei}>
                  <div className="ql-ex-head">
                    <input className="inp" style={{ fontWeight: 600 }} value={ex.name}
                      onChange={(e) => editEx(ei, { name: e.target.value })} placeholder="Exercise" />
                    <button className="ql-del" style={{ marginLeft: 8 }} onClick={() => delEx(ei)}><Icon name="x" size={13} stroke={2.4} /></button>
                  </div>
                  <div className="ql-sets" style={{ marginTop: 8 }}>
                    {ex.sets.map((st, si) => (
                      <div className="ql-set" key={si}>
                        <input className="ql-in mono" value={st.weight ?? ''} placeholder="wt"
                          onChange={(e) => editSet(ei, si, 'weight', e.target.value)} />
                        <span className="ql-mul">×</span>
                        <input className="ql-in mono" style={{ width: 54 }} value={st.reps ?? ''} placeholder="reps"
                          onChange={(e) => editSet(ei, si, 'reps', e.target.value)} />
                      </div>
                    ))}
                    <button className="link" style={{ fontSize: 12 }} onClick={() => addSet(ei)}>+ set</button>
                  </div>
                  {ex.note ? <div className="ql-note" style={{ marginTop: 6 }}>{ex.note}</div> : null}
                </div>
              ))}

              <button className="link" onClick={addEx}>+ Add an exercise</button>

              {/* Zone 2 + note */}
              <div className="log-grid" style={{ marginTop: 4 }}>
                <div>
                  <label className="lbl">Zone 2 walk (min)</label>
                  <input className="inp" type="number" value={session.zone2Min ?? ''}
                    onChange={(e) => setSession((s) => ({ ...s, zone2Min: e.target.value }))} placeholder="0" />
                </div>
              </div>
              <label className="lbl">Session note</label>
              <textarea className="inp" style={{ minHeight: 56, resize: 'none' }}
                value={session.note} onChange={(e) => setSession((s) => ({ ...s, note: e.target.value }))} />
            </div>

            <div className="ql-foot">
              <button className="ql-go solid" onClick={save}>
                <Icon name="check" size={16} stroke={2.4} /> Save {TITLE[session.sessionType] || ''}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const TITLE = {
  'upper-lift': 'Upper Body', 'lower-lift': 'Lower Body',
  explosive: 'Explosive Day', 'echo-bike': 'Echo Bike',
  zone2: 'Zone 2', mobility: 'Mobility',
}
