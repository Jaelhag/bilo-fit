import { useEffect, useRef, useState } from 'react'
import { Icon } from '../lib/icons.jsx'
import { Ring, Card, Label, DateField, todayStr, dateToISO } from '../lib/charts.jsx'
import { GOALS } from '../data/library.js'
import { suggestProgression } from '../lib/engine.js'
import { newId } from '../lib/storage.js'

export default function Session({ state, update, activeGoal, goTo }) {
  const program = state.programs[activeGoal.id]
  const [logs, setLogs] = useState(() => initLogs(program))
  const [open, setOpen] = useState(program ? program[0].drillId : null)
  const [finished, setFinished] = useState(null)
  const [logDate, setLogDate] = useState(todayStr())

  if (!program) {
    return (
      <div className="screen">
        <header className="hd"><div className="hd-hi">Train</div></header>
        <Card glow style={{ borderColor: 'color-mix(in oklab, var(--accent) 40%, transparent)' }}>
          <Label icon="bolt">{activeGoal.emoji} {activeGoal.name}</Label>
          <div className="hero-note" style={{ marginTop: 8 }}>No program yet</div>
          <p className="muted sm" style={{ marginTop: 6 }}>
            Build your {activeGoal.name} program first — answer a few questions and it's ready in seconds.
          </p>
          <button className="btn primary big" style={{ marginTop: 12 }} onClick={() => goTo('assess')}>
            Start assessment →
          </button>
        </Card>
        <div className="botpad" />
      </div>
    )
  }

  const setLog = (drillId, patch) =>
    setLogs((prev) => ({ ...prev, [drillId]: { ...prev[drillId], ...patch } }))

  const finish = () => {
    const session = {
      id: newId(),
      goalId: activeGoal.id,
      date: dateToISO(logDate),
      soreDays: null,
      drills: program.map((d) => ({ drillId: d.drillId, name: d.name, ...logs[d.drillId] })),
    }
    update((s) => { s.sessions.push(session) })
    setFinished(session)
  }

  const total = program.reduce((n, d) => n + parseInt(d.params.sets, 10) || n + 3, 0)
  const done  = Object.values(logs).reduce((n, l) => n + (l.setsDone ? parseInt(l.setsDone, 10) : 0), 0)

  if (finished) {
    return <Review program={program} session={finished} goalId={activeGoal.id} goTo={goTo} />
  }

  return (
    <div className="screen">
      <header className="hd">
        <div>
          <div className="hd-hi">Train</div>
          <div className="hd-sub mono">{activeGoal.emoji} {activeGoal.name}</div>
        </div>
        <Ring value={done / (total || 1)} size={46} stroke={5}
          label={`${done}/${total}`} glow={false} />
      </header>

      {/* Session overview */}
      <Card glow>
        <div className="row-between">
          <div>
            <Label icon="train">Today's session</Label>
            <div className="hero-note" style={{ marginTop: 6 }}>{program.length} drills</div>
          </div>
          <div className="prog-num">
            <span className="mono big">{done}</span>
            <span className="muted"> / {total} sets</span>
          </div>
        </div>
        <div className="track" style={{ marginTop: 10 }}>
          <div className="track-fill" style={{ width: `${(done / (total || 1)) * 100}%` }} />
        </div>
        <div style={{ marginTop: 12 }}>
          <DateField value={logDate} onChange={setLogDate} label="Session date" />
        </div>
      </Card>

      {program.map((d) => (
        <DrillCard
          key={d.drillId}
          drill={d}
          log={logs[d.drillId]}
          setLog={(patch) => setLog(d.drillId, patch)}
          isOpen={open === d.drillId}
          onToggle={() => setOpen(open === d.drillId ? null : d.drillId)}
        />
      ))}

      <div className="sticky-actions">
        <button className="btn primary big" onClick={finish}>
          <Icon name="check" size={18} stroke={2.4} /> Finish & save session
        </button>
      </div>
      <div className="botpad" />
    </div>
  )
}

function initLogs(program) {
  const out = {}
  ;(program || []).forEach((d) => {
    out[d.drillId] = { rpe: null, setsDone: firstInt(d.params.sets) || 3, load: '', depthNote: '', maxRange: false }
  })
  return out
}

// ---- Drill card ----
function DrillCard({ drill, log, setLog, isOpen, onToggle }) {
  return (
    <div className={`card drill ${isOpen ? 'card-glow' : ''}`}>
      <button className="drill-head" onClick={onToggle}>
        <span className="slot">{drill.slot}</span>
        <span className="drill-title">
          {drill.name}
          {drill.draft && <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 6 }}>draft</span>}
        </span>
        <SetProgress log={log} drill={drill} />
        <span className="chev">
          <Icon name={isOpen ? 'back' : 'chevron'} size={16} stroke={2}
            style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0)' }} />
        </span>
      </button>

      {isOpen && (
        <div className="drill-body">
          <div className="params">
            <ParamChip k="Reps"  v={drill.params.reps} />
            <ParamChip k="Sets"  v={drill.params.sets} />
            <ParamChip k="Tempo" v={drill.params.tempo} />
            <ParamChip k="Rest"  v={drill.params.rest} />
            {drill.params.load && drill.params.load !== 'bodyweight' &&
              <ParamChip k="Load" v={drill.params.load} />}
          </div>

          {drill.cue && <p className="cue">{drill.cue}</p>}
          <a className="link" href={drill.video} target="_blank" rel="noreferrer">
            <Icon name="play" size={14} stroke={2} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Watch form video
          </a>

          <TempoTimer drill={drill} />

          {/* Log */}
          <div className="logbox">
            <div>
              <div className="lbl">How hard did it feel?</div>
              <div className="rpe">
                {[2,4,6,8,10].map((n) => (
                  <button key={n} className={`rpe-btn ${log.rpe === n ? 'sel' : ''}`}
                    onClick={() => setLog({ rpe: n })}>
                    {['','','Easy','','Light','','Moderate','','Hard','','Max'][n]}
                  </button>
                ))}
              </div>
            </div>
            <div className="log-grid">
              <div>
                <label className="lbl">Sets done</label>
                <input className="inp" type="number" min="0" value={log.setsDone ?? ''}
                  onChange={(e) => setLog({ setsDone: e.target.value })} />
              </div>
              <div>
                <label className="lbl">Load</label>
                <input className="inp" type="text" placeholder="e.g. 8kg"
                  value={log.load} onChange={(e) => setLog({ load: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="lbl">Range note (how deep today?)</label>
              <input className="inp" type="text" placeholder="e.g. knees 4 inches off floor"
                value={log.depthNote} onChange={(e) => setLog({ depthNote: e.target.value })} />
            </div>
            <label className="check">
              <input type="checkbox" checked={log.maxRange}
                onChange={(e) => setLog({ maxRange: e.target.checked })} />
              Reached max range — can't go deeper right now
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

function SetProgress({ log, drill }) {
  const sets = parseInt(drill.params.sets, 10)
  if (!sets || isNaN(sets)) return null
  const done = parseInt(log.setsDone, 10) || 0
  return (
    <div style={{ display: 'flex', gap: 4, marginRight: 4 }}>
      {Array.from({ length: Math.min(sets, 5) }).map((_, i) => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: 999,
          background: i < done ? 'var(--accent)' : 'var(--line2)',
          boxShadow: i < done ? '0 0 calc(5px*var(--glow)) var(--accent)' : 'none',
        }} />
      ))}
    </div>
  )
}

function ParamChip({ k, v }) {
  return (
    <div className="param">
      <span className="pk">{k}</span>
      <span className="pv">{v}</span>
    </div>
  )
}

// ---- Tempo timer ----
function TempoTimer({ drill }) {
  const steps = buildSteps(drill)
  const [i, setI] = useState(0)
  const [remaining, setRemaining] = useState(steps[0]?.sec || 0)
  const [running, setRunning] = useState(false)
  const tick = useRef(null)

  useEffect(() => {
    if (!running) return
    tick.current = setInterval(() => {
      setRemaining((r) => {
        if (r > 1) return r - 1
        setI((idx) => {
          const next = idx + 1
          if (next >= steps.length) { setRunning(false); return idx }
          buzz()
          setRemaining(steps[next].sec)
          return next
        })
        return 0
      })
    }, 1000)
    return () => clearInterval(tick.current)
  }, [running, steps.length])

  const reset = () => { setRunning(false); setI(0); setRemaining(steps[0]?.sec || 0) }
  const cur  = steps[i] || steps[steps.length - 1]
  const done = i >= steps.length - 1 && remaining === 0
  if (!steps.length) return null

  return (
    <div className="timer">
      <div className="timer-face">
        <div className="timer-phase">{done ? 'Done ✓' : cur.label}</div>
        <div className="timer-count mono">{done ? '' : remaining}</div>
        <div className="timer-tag muted">{cur.tag}</div>
      </div>
      <div className="timer-ctrls">
        <button className="btn" onClick={() => setRunning((r) => !r)}>
          <Icon name={running ? 'x' : 'play'} size={16} stroke={2} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          {running ? 'Pause' : (i === 0 && remaining === steps[0]?.sec ? 'Start' : 'Resume')}
        </button>
        <button className="btn ghost" onClick={reset}>Reset</button>
      </div>
      <p className="muted sm" style={{ textAlign: 'center', marginTop: 6 }}>
        Guided pacing — optional, you can self-pace.
      </p>
    </div>
  )
}

function buzz() { try { navigator.vibrate && navigator.vibrate(120) } catch {} }

function buildSteps(drill) {
  const type = drill.type
  const tempo = String(drill.params.tempo || '')
  const repsStr = String(drill.params.reps || '')

  if (type === 'isometric' || /hold/i.test(tempo)) {
    const sec = firstInt(repsStr) || 40
    return [{ label: 'Hold at end range', sec, tag: `${sec}s max hold` }]
  }
  if (type === 'contract-relax' || /relax/i.test(tempo)) {
    const cycles = firstInt(repsStr) || 6
    const steps = []
    for (let c = 1; c <= cycles; c++) {
      steps.push({ label: 'Pull deeper', sec: 5, tag: `Cycle ${c}/${cycles}` })
      steps.push({ label: 'Relax',       sec: 5, tag: `Cycle ${c}/${cycles}` })
    }
    return steps
  }
  const nums = tempo.split('-').map((x) => parseInt(x, 10)).filter((x) => !isNaN(x))
  if (!nums.length) return []
  const labels = nums.length >= 4
    ? ['Lower in', 'Hold deep', 'Come up', 'Pause top']
    : ['Lower in', 'Hold deep', 'Come up']
  const reps = Math.min(firstInt(repsStr) || 5, 12)
  const steps = []
  for (let r = 1; r <= reps; r++) {
    nums.forEach((sec, idx) => {
      if (sec > 0) steps.push({ label: labels[idx] || 'Move', sec, tag: `Rep ${r}/${reps}` })
    })
  }
  return steps
}

function firstInt(s) { const m = String(s).match(/\d+/); return m ? parseInt(m[0], 10) : null }

// ---- Post-session review ----
function Review({ program, session, goalId, goTo }) {
  return (
    <div className="screen">
      <Card glow style={{ textAlign: 'center', padding: '32px 20px' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 999, display: 'grid', placeItems: 'center',
          background: 'color-mix(in oklab, var(--accent) 85%, black)',
          boxShadow: '0 0 calc(30px*var(--glow)) color-mix(in oklab, var(--accent) 55%, transparent)',
          margin: '0 auto 14px', color: '#fff',
        }}>
          <Icon name="check" size={28} stroke={2.6} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Session saved ✓</div>
        <div className="muted sm" style={{ marginTop: 6 }}>Here's what to aim for next time:</div>
      </Card>

      {program.map((d) => {
        const log = session.drills.find((x) => x.drillId === d.drillId)
        const sug = suggestProgression(goalId, d.drillId, log)
        return (
          <Card key={d.drillId}>
            <div className="row-between">
              <strong>{d.slot} · {d.name}</strong>
              {sug && <span className={`lever lever-${sug.lever}`}>{sug.lever}</span>}
            </div>
            {sug && <div className="sug-h">{sug.headline}</div>}
            {sug && <div className="muted sm" style={{ marginTop: 4 }}>{sug.detail}</div>}
          </Card>
        )
      })}

      <Card>
        <div className="muted sm">
          Open History to log your soreness — that tunes when your next session is scheduled.
        </div>
      </Card>

      <div className="sticky-actions">
        <button className="btn primary big" onClick={() => goTo('home')}>Done</button>
      </div>
      <div className="botpad" />
    </div>
  )
}
