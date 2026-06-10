import { useState } from 'react'
import { Icon } from '../lib/icons.jsx'
import { DateField, todayStr, dateToISO } from '../lib/charts.jsx'
import { guessType, parseWorkout, SESSION_TYPES } from '../lib/parse.js'
import { hasAi, getAiKey, aiParse, fileToInline } from '../lib/ai.js'
import { calcE1RM } from '../data/conditioning.js'

export default function QuickLog({ onClose, update }) {
  const [phase, setPhase] = useState('input')   // input | review | saved
  const [mode, setMode]   = useState('type')    // type | snap
  const [notes, setNotes] = useState('')
  const [session, setSession] = useState(null)
  const [logDate, setLogDate] = useState(todayStr())
  const [ocrBusy, setOcrBusy] = useState(false)
  const [ocrPct, setOcrPct]   = useState(0)
  const [ocrIdx, setOcrIdx]   = useState(null)   // { cur, total } across multiple images
  const [err, setErr]         = useState(null)
  const [useAi, setUseAi]     = useState(hasAi())
  const [busy, setBusy]       = useState(false)  // AI in-flight

  const applyDate = (parsed) => {
    if (parsed?.dateGuess) {
      const d = new Date(parsed.dateGuess)
      if (!isNaN(d)) { const off = d.getTimezoneOffset() * 60000; setLogDate(new Date(d - off).toISOString().slice(0, 10)) }
    }
  }

  async function onPickImage(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setErr(null); e.target.value = ''

    // ---- AI path: send the image(s) straight to Gemini (OCR + parse in one) ----
    if (useAi && hasAi()) {
      setBusy(true)
      try {
        const images = await Promise.all(files.map(fileToInline))
        const parsed = await aiParse(getAiKey(), { images })
        setSession(parsed); setPhase('review')
      } catch (e2) {
        setErr('AI couldn’t read that: ' + (e2?.message || 'unknown error'))
      }
      setBusy(false)
      return
    }

    // ---- On-device path: Tesseract OCR → text ----
    setOcrBusy(true); setOcrPct(0)
    try {
      const Tesseract = (await import('tesseract.js')).default
      let combined = notes ? notes.trimEnd() + '\n\n' : ''
      let gotAny = false
      for (let i = 0; i < files.length; i++) {
        setOcrIdx({ cur: i + 1, total: files.length }); setOcrPct(0)
        const { data } = await Tesseract.recognize(files[i], 'eng', {
          logger: (m) => { if (m.status === 'recognizing text') setOcrPct(Math.round((m.progress || 0) * 100)) },
        })
        const text = (data.text || '').trim()
        if (text) { combined += text + '\n\n'; gotAny = true }
      }
      combined = combined.trim()
      if (!gotAny) setErr("Couldn't read any text from those images — try clearer screenshots.")
      else setNotes(combined)
    } catch (e2) {
      setErr('Could not read the image: ' + (e2?.message || 'unknown error'))
    }
    setOcrBusy(false); setOcrIdx(null)
  }

  async function runParse() {
    setErr(null)
    if (useAi && hasAi()) {
      setBusy(true)
      try {
        const parsed = await aiParse(getAiKey(), { text: notes })
        setSession(parsed); setPhase('review')
      } catch (e) {
        setErr(e.message + ' (You can switch off AI to use the built-in reader.)')
      }
      setBusy(false)
      return
    }
    const type = guessType(notes)
    const parsed = parseWorkout(notes, type)
    applyDate(parsed)
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
            <div className="seg">
              <button className={`seg-b ${mode === 'type' ? 'on' : ''}`} onClick={() => setMode('type')}>
                <Icon name="pencil" size={15} stroke={2} /> Type
              </button>
              <button className={`seg-b ${mode === 'snap' ? 'on' : ''}`} onClick={() => setMode('snap')}>
                <Icon name="camera" size={15} stroke={2} /> Screenshot
              </button>
            </div>

            {/* AI toggle (only if a Gemini key is connected) */}
            {hasAi() && (
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 10, background: useAi ? 'color-mix(in oklab, var(--accent) 10%, transparent)' : 'var(--panel2)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
                  <Icon name="spark" size={15} style={{ color: 'var(--accent)' }} /> Use AI to read it
                </span>
                <input type="checkbox" checked={useAi} onChange={(e) => setUseAi(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} />
              </label>
            )}

            {/* Screenshot picker (shown until we have text) */}
            {mode === 'snap' && !notes && (
              <label style={{ minHeight: 200, border: '1.5px dashed var(--line2)', borderRadius: 16, background: 'var(--panel2)', cursor: (ocrBusy || busy) ? 'default' : 'pointer', display: 'grid', placeItems: 'center', overflow: 'hidden', padding: 16 }}>
                <input type="file" accept="image/*" multiple hidden onChange={onPickImage} disabled={ocrBusy || busy} />
                {(ocrBusy || busy) ? (
                  <div style={{ textAlign: 'center', color: 'var(--accent)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <span className="spin" style={{ width: 26, height: 26, borderWidth: 3 }} />
                    <div style={{ fontWeight: 600 }}>
                      {busy ? 'AI is reading your notes…' : `Reading ${ocrIdx && ocrIdx.total > 1 ? `image ${ocrIdx.cur} of ${ocrIdx.total}` : 'your notes'}… ${ocrPct}%`}
                    </div>
                    <div className="muted sm">{busy ? 'Sent to Gemini AI' : 'Happening privately on your device'}</div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--accent)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, fontWeight: 600 }}>
                    <Icon name="image" size={30} />
                    <div>Choose screenshot(s)<br /><span className="muted sm">{useAi ? 'AI will read & organize them' : 'pick one or several of your notes'}</span></div>
                  </div>
                )}
              </label>
            )}

            {/* Text box — shown for Type mode, or after a screenshot is read */}
            {(mode === 'type' || notes) && (
              <>
                <textarea className="ql-ta" autoFocus={mode === 'type'}
                  placeholder={"Paste or type your workout, however you write it…\n\nPulldown: 50x10, 90x10, 120x10, 150x10\nDbell row - 110x9\nIncline dbell - 25x5, 35x5, 45x5\ntreadmill walk 30 min"}
                  value={notes} onChange={(e) => setNotes(e.target.value)} />
                <div className="ql-hint">
                  {mode === 'snap' && notes ? 'Read from your screenshot(s) — fix any typos, then continue.' : <>It reads your sets (e.g. <b>150x10</b>), splits out notes, and you'll confirm everything before saving.</>}
                </div>
                {mode === 'snap' && notes && (
                  <label className="link" style={{ cursor: 'pointer' }}>
                    <input type="file" accept="image/*" multiple hidden onChange={onPickImage} disabled={ocrBusy} />
                    {ocrBusy
                      ? <>Reading {ocrIdx && ocrIdx.total > 1 ? `image ${ocrIdx.cur} of ${ocrIdx.total}` : ''}… {ocrPct}%</>
                      : '+ Add another screenshot'}
                  </label>
                )}
              </>
            )}

            {err && <div className="ql-err">{err}</div>}

            <button className="ql-go" disabled={!notes.trim() || ocrBusy || busy} onClick={runParse}>
              {busy
                ? <><span className="spin" /> AI is reading…</>
                : <><Icon name="spark" size={16} /> {useAi && hasAi() ? 'Read with AI' : 'Read my notes'}</>}
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
