import { useRef, useEffect, useState } from 'react'
import { Icon } from '../lib/icons.jsx'

// Canned parse results for demo mode
const CANNED = {
  mobility: {
    sessionType: 'mobility',
    title: 'Side Split · Beginner',
    drills: [
      { name: 'Horse Stance Slides', sets: [{ note: '1 cluster set — focused on hip position' }] },
      { name: "Tailor's Pose", sets: [{ load: '8kg', reps: '8' }, { load: '8kg', reps: '8' }, { load: '8kg', reps: '7' }] },
      { name: 'Horse Stance Squats', sets: [{ reps: '8' }, { reps: '8' }, { reps: '8' }] },
      { name: 'Standing Pancake Hang', sets: [{ note: '6 cycles · felt a release on cycle 4' }] },
    ],
    clarify: ['Did you notice more range in the left or right side today?', 'Any tightness or discomfort to flag?'],
  },
  explosive: {
    sessionType: 'explosive',
    title: 'Explosive Day · Hill Sprints',
    warmupDone: ['gw-walk', 'dp-butt', 'dp-shuffle', 'dp-hurdle', 'dp-swing', 'el-fwd', 'el-side', 'el-pogo2', 'el-pogo1'],
    sprintWork: [
      { workType: 'hill-10s', sets: '3', rpe: '7.5–8', recovery: 'Walk down', note: '' },
      { workType: 'stride100', sets: '2', rpe: '70–80%', recovery: '90s walk', note: '' },
    ],
    clarify: ['Were the hill sprints timed or just effort-based?'],
  },
  'echo-bike': {
    sessionType: 'echo-bike',
    title: 'Echo Bike · 4×4',
    protocol: '4x4',
    intervalLogs: [
      { wattsLow: '130', wattsHigh: '260', hr: '182' },
      { wattsLow: '135', wattsHigh: '280', hr: '185' },
      { wattsLow: '140', wattsHigh: '300', hr: '187' },
      { wattsLow: '140', wattsHigh: '310', hr: '188' },
    ],
    hrMax: '188', hrAvg: '143', duration: '41:38',
    clarify: ['Was this a 4×4 or 1-min protocol?'],
  },
  lift: {
    sessionType: 'upper-lift',
    title: 'Upper Body · Hypertrophy',
    exercises: [
      { name: 'Bench Press', sets: [{ weight: '185', reps: '8', rpe: '8' }, { weight: '185', reps: '8', rpe: '8' }, { weight: '185', reps: '7', rpe: '9' }] },
      { name: 'Incline DB Press', sets: [{ weight: '65', reps: '10' }, { weight: '65', reps: '10' }] },
      { name: 'Cable Row', sets: [{ weight: '150', reps: '10' }, { weight: '150', reps: '10' }, { weight: '150', reps: '9' }] },
    ],
    zone2Min: '30',
    clarify: ['Was the last bench set taken to failure?'],
  },
}

function detectSessionType(notes) {
  const n = notes.toLowerCase()
  if (/hill sprint|hill run|stride|plyom|pogo|explosive|butt kick|shuffle|sprint day/i.test(n)) return 'explosive'
  if (/echo bike|echo|4x4|4×4|norwegian|1 min|one min|watt/i.test(n)) return 'echo-bike'
  if (/bench|squat|deadlift|rdl|row|press|pull.?up|bulgarian|rdl|lift/i.test(n)) {
    if (/lower|squat|deadlift|rdl|bulgarian|leg|glute/i.test(n)) return 'lower-lift'
    return 'upper-lift'
  }
  if (/zone 2|z2|walk|bike|cardio|run|jog/i.test(n)) return 'zone2'
  return 'mobility'
}

function parsePrompt(notes) {
  const type = detectSessionType(notes)
  const base = `Athlete's notes:
"""
${notes}
"""
Return ONLY minified JSON (no prose, no code fences). Include "sessionType":"${type}" in the root.`

  if (type === 'explosive') {
    return `${base}
Shape: {"sessionType":"explosive","title":"short title","sprintWork":[{"workType":"hill-10s|stride100|fly60|custom","sets":"3","rpe":"7.5–8","recovery":"walk down","note":""}],"clarify":["question"]}`
  }
  if (type === 'echo-bike') {
    return `${base}
Shape: {"sessionType":"echo-bike","title":"short title","protocol":"4x4 or 1min","intervalLogs":[{"wattsLow":"","wattsHigh":"","hr":""}],"hrMax":"","hrAvg":"","duration":"","clarify":["question"]}`
  }
  if (type === 'upper-lift' || type === 'lower-lift') {
    return `${base}
Shape: {"sessionType":"${type}","title":"short title","exercises":[{"name":"","sets":[{"weight":"","reps":"","rpe":""}]}],"zone2Min":"","clarify":["question"]}`
  }
  if (type === 'zone2') {
    return `${base}
Shape: {"sessionType":"zone2","title":"Zone 2 session","zone2Min":"","note":"","clarify":[]}`
  }
  return `${base}
Shape: {"sessionType":"mobility","title":"short session title","drills":[{"name":"","sets":[{"reps":"","load":"","note":""}]}],"clarify":["question"]}`
}

export default function QuickLog({ onClose, onSaved }) {
  const [mode, setMode]   = useState('type')
  const [phase, setPhase] = useState('input')    // input | parsing | review
  const [notes, setNotes] = useState('')
  const [img, setImg]     = useState(null)
  const [session, setSession] = useState(null)
  const [msgs, setMsgs]   = useState([])
  const [chat, setChat]   = useState('')
  const [busy, setBusy]   = useState(false)
  const [err, setErr]     = useState(null)
  const [saved, setSaved] = useState(false)
  const scrollRef         = useRef(null)

  useEffect(() => { scrollRef.current?.scrollTo(0, 1e5) }, [msgs, busy])

  const seedChat = (s) =>
    setMsgs((s.clarify?.length)
      ? [{ role: 'ai', text: 'Got it — here\'s what I logged. ' + s.clarify[0] },
         ...(s.clarify[1] ? [{ role: 'ai', text: s.clarify[1] }] : [])]
      : [{ role: 'ai', text: 'Logged. Anything to add or fix?' }])

  async function runParse() {
    setErr(null); setPhase('parsing')
    if (mode === 'snap') {
      await new Promise((r) => setTimeout(r, 1600))
      // Pick a relevant canned example
      const s = JSON.parse(JSON.stringify(CANNED['explosive']))
      setSession(s); seedChat(s); setPhase('review')
      return
    }
    try {
      if (window.claude?.complete) {
        const raw = await window.claude.complete(parsePrompt(notes))
        const m = raw.match(/\{[\s\S]*\}/)
        const s = JSON.parse(m ? m[0] : raw)
        setSession(s); seedChat(s); setPhase('review')
      } else {
        // No AI — detect type and use matching canned example
        await new Promise((r) => setTimeout(r, 900))
        const type = detectSessionType(notes)
        const key = type.includes('lift') ? 'lift' : (CANNED[type] ? type : 'mobility')
        const s = JSON.parse(JSON.stringify(CANNED[key]))
        setSession(s); seedChat(s); setPhase('review')
      }
    } catch {
      setErr("Couldn't parse that — try rephrasing or add a bit more detail.")
      setPhase('input')
    }
  }

  async function sendChat() {
    const text = chat.trim()
    if (!text || busy) return
    setChat(''); setMsgs((m) => [...m, { role: 'me', text }]); setBusy(true)
    try {
      if (window.claude?.complete) {
        const history = [...msgs, { role: 'me', text }]
          .map((m) => `${m.role === 'me' ? 'Athlete' : 'Coach'}: ${m.text}`).join('\n')
        const prompt = `You are a concise mobility training assistant. Session: ${JSON.stringify(session)}\n${history}\nReply in ONE short sentence. If the athlete changes data, append updated JSON in <json></json>.`
        const raw = await window.claude.complete(prompt)
        const jm = raw.match(/<json>([\s\S]*?)<\/json>/)
        if (jm) { try { setSession(JSON.parse(jm[1].match(/\{[\s\S]*\}/)[0])) } catch {} }
        const reply = raw.replace(/<json>[\s\S]*?<\/json>/, '').trim() || 'Updated.'
        setMsgs((m) => [...m, { role: 'ai', text: reply }])
      } else {
        await new Promise((r) => setTimeout(r, 600))
        setMsgs((m) => [...m, { role: 'ai', text: "Got it — I'll note that." }])
      }
    } catch {
      setMsgs((m) => [...m, { role: 'ai', text: 'Hmm, lost that — mind repeating?' }])
    }
    setBusy(false)
  }

  function pickImg(e) {
    const f = e.target.files?.[0]
    if (f) setImg(URL.createObjectURL(f))
  }

  const editSet = (di, si, k, v) => setSession((s) => {
    const n = JSON.parse(JSON.stringify(s))
    n.drills[di].sets[si][k] = v
    return n
  })
  const delDrill = (di) => setSession((s) => ({ ...s, drills: s.drills.filter((_, i) => i !== di) }))

  function save() {
    onSaved && onSaved(session)
    setSaved(true)
    setTimeout(onClose, 1100)
  }

  return (
    <div className="ql-wrap" onClick={onClose}>
      <div className="ql" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="ql-head">
          <div className="ql-title">{phase === 'review' ? 'Review session' : 'Log a session'}</div>
          <button className="ql-x" onClick={onClose}><Icon name="x" size={18} stroke={2.2} /></button>
        </div>

        {/* Saved confirmation */}
        {saved && (
          <div className="ql-saved">
            <div className="ql-saved-i"><Icon name="check" size={28} stroke={2.6} /></div>
            Saved to today's log
          </div>
        )}

        {/* Input phase */}
        {!saved && phase !== 'review' && (
          <div className="ql-body">
            <div className="seg">
              <button className={`seg-b ${mode === 'type' ? 'on' : ''}`} onClick={() => setMode('type')}>
                <Icon name="pencil" size={15} stroke={2} /> Type
              </button>
              <button className={`seg-b ${mode === 'snap' ? 'on' : ''}`} onClick={() => setMode('snap')}>
                <Icon name="camera" size={15} stroke={2} /> Snap
              </button>
            </div>

            {mode === 'type' ? (
              <>
                <textarea className="ql-ta"
                  placeholder={"Dump it however you write it…\n\nHorse stance slides x10 cluster\nTailors pose 8kg 3x8\nHorse squats bw 3x8\nPancake hang 2 sets felt tight on right side"}
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  disabled={phase === 'parsing'} />
                <div className="ql-hint mono">Shorthand is fine — AI will organise it.</div>
              </>
            ) : (
              <label style={{ minHeight: 200, border: '1.5px dashed var(--line2)', borderRadius: 16, background: 'var(--panel2)', cursor: 'pointer', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                <input type="file" accept="image/*" capture="environment" onChange={pickImg} hidden />
                {img
                  ? <img src={img} style={{ width: '100%', maxHeight: 320, objectFit: 'cover' }} alt="notes" />
                  : <div style={{ textAlign: 'center', color: 'var(--accent)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 14, lineHeight: 1.5 }}>
                      <Icon name="image" size={30} />
                      <div>Tap to snap or upload<br /><span className="muted sm">a photo of your notes</span></div>
                    </div>
                }
              </label>
            )}

            {err && <div className="ql-err">{err}</div>}

            <button className="ql-go"
              disabled={phase === 'parsing' || (mode === 'type' ? !notes.trim() : !img)}
              onClick={runParse}>
              {phase === 'parsing'
                ? <><span className="spin" /> {mode === 'snap' ? 'Reading your notes…' : 'Organising…'}</>
                : <><Icon name="spark" size={16} /> Parse with AI</>}
            </button>
          </div>
        )}

        {/* Review phase */}
        {!saved && phase === 'review' && session && (
          <div className="ql-review" ref={scrollRef}>
            <div className="ql-detected">
              <span className="pill">Detected</span>
              <span className="ql-sesstitle">{session.title}</span>
              <span className="muted sm mono">{session.drills?.length || 0} drills</span>
            </div>

            {/* Mobility drills */}
        {session.drills?.map((dr, di) => (
          <div className="ql-ex" key={di}>
            <div className="ql-ex-head">
              <div className="exr-name">{dr.name}</div>
              <button className="ql-del" onClick={() => delDrill(di)}><Icon name="x" size={13} stroke={2.4} /></button>
            </div>
            <div className="ql-sets">
              {dr.sets?.map((st, si) => (
                <div className="ql-set" key={si}>
                  {st.load !== undefined && <>
                    <input className="ql-in mono" value={st.load || ''} placeholder="load"
                      onChange={(e) => editSet(di, si, 'load', e.target.value)} />
                    <span className="ql-mul">×</span>
                  </>}
                  {st.reps !== undefined && (
                    <input className="ql-in mono" style={{ width: 56 }} value={st.reps ?? ''} placeholder="reps"
                      onChange={(e) => editSet(di, si, 'reps', e.target.value)} />
                  )}
                  {st.note && <span className="ql-note">{st.note}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Exercises (lift) */}
        {session.exercises?.map((ex, ei) => (
          <div className="ql-ex" key={ei}>
            <div className="ql-ex-head">
              <div className="exr-name">{ex.name}</div>
              <button className="ql-del" onClick={() => setSession((s) => ({ ...s, exercises: s.exercises.filter((_,i)=>i!==ei) }))}><Icon name="x" size={13} stroke={2.4} /></button>
            </div>
            <div className="ql-sets">
              {ex.sets?.map((st, si) => (
                <div className="ql-set" key={si}>
                  <input className="ql-in mono" value={st.weight||''} placeholder="lb"
                    onChange={(e) => { const n=JSON.parse(JSON.stringify(session)); n.exercises[ei].sets[si].weight=e.target.value; setSession(n) }} />
                  <span className="ql-mul">×</span>
                  <input className="ql-in mono" style={{ width:50 }} value={st.reps||''} placeholder="reps"
                    onChange={(e) => { const n=JSON.parse(JSON.stringify(session)); n.exercises[ei].sets[si].reps=e.target.value; setSession(n) }} />
                  {st.rpe && <span className="ql-rpe mono">RPE {st.rpe}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Sprint work */}
        {session.sprintWork?.map((sw, i) => (
          <div className="ql-ex" key={i}>
            <div className="exr-name">{sw.workType?.replace(/-/g,' ')} · {sw.sets} sets</div>
            <div className="muted sm" style={{ marginTop: 4 }}>RPE {sw.rpe} · Recovery: {sw.recovery}</div>
            {sw.note && <div className="ql-note" style={{ marginTop: 4 }}>{sw.note}</div>}
          </div>
        ))}

        {/* Echo bike intervals */}
        {session.intervalLogs?.map((iv, i) => (
          <div className="ql-ex" key={i}>
            <div className="exr-name">Interval {i+1}</div>
            <div className="ql-set" style={{ marginTop: 8 }}>
              <div className="muted sm">Watts low:</div>
              <input className="ql-in mono" value={iv.wattsLow||''} placeholder="130"
                onChange={(e) => { const n=JSON.parse(JSON.stringify(session)); n.intervalLogs[i].wattsLow=e.target.value; setSession(n) }} />
              <div className="muted sm">high:</div>
              <input className="ql-in mono" value={iv.wattsHigh||''} placeholder="280"
                onChange={(e) => { const n=JSON.parse(JSON.stringify(session)); n.intervalLogs[i].wattsHigh=e.target.value; setSession(n) }} />
              <div className="muted sm">HR:</div>
              <input className="ql-in mono" style={{width:60}} value={iv.hr||''} placeholder="185"
                onChange={(e) => { const n=JSON.parse(JSON.stringify(session)); n.intervalLogs[i].hr=e.target.value; setSession(n) }} />
            </div>
          </div>
        ))}

        {/* Zone 2 */}
        {session.sessionType === 'zone2' && (
          <div className="ql-ex">
            <div className="exr-name">Zone 2 · {session.zone2Min} min</div>
            {session.note && <div className="muted sm" style={{ marginTop: 4 }}>{session.note}</div>}
          </div>
        )}

            <div className="ql-chat">
              <div className="ql-chat-lab"><Icon name="spark" size={13} /> Coach check</div>
              {msgs.map((m, i) => (
                <div key={i} className={`bub ${m.role}`}>{m.text}</div>
              ))}
              {busy && <div className="bub ai"><span className="typing"><i /><i /><i /></span></div>}
            </div>
          </div>
        )}

        {/* Footer */}
        {!saved && phase === 'review' && (
          <div className="ql-foot">
            <div className="ql-chatbar">
              <input value={chat} onChange={(e) => setChat(e.target.value)}
                placeholder="Answer or add a detail…"
                onKeyDown={(e) => e.key === 'Enter' && sendChat()} />
              <button onClick={sendChat} disabled={busy || !chat.trim()}>
                <Icon name="send" size={17} />
              </button>
            </div>
            <button className="ql-go solid" onClick={save}>
              <Icon name="check" size={16} stroke={2.4} /> Save to log
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
