import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../lib/icons.jsx'
import { Card, Label, Spark } from '../../lib/charts.jsx'
import { ECHO_PROTOCOLS, nextEchoProtocol } from '../../data/conditioning.js'

export default function EchoBikeDay({ state, update, echoCount = 0 }) {
  const protocol = nextEchoProtocol(echoCount)
  const [override, setOverride] = useState(null)
  const activeProtocol = override ? ECHO_PROTOCOLS[override] : protocol

  const [phase, setPhase] = useState('setup')   // setup | warmup | work | done
  const [curInterval, setCurInterval] = useState(0)
  const [inWork, setInWork] = useState(true)   // true=work, false=rest
  const [remaining, setRemaining] = useState(0)
  const [running, setRunning] = useState(false)
  const [intervalLogs, setIntervalLogs] = useState(() =>
    activeProtocol.intervals.map(() => ({ wattsLow: '', wattsHigh: '', hr: '' }))
  )
  const [summary, setSummary] = useState({ duration: '', hrAvg: '', hrMax: '', note: '' })
  const [saved, setSaved] = useState(false)
  const tick = useRef(null)

  // Reset when protocol changes
  const resetWorkout = () => {
    setCurInterval(0); setInWork(true); setRemaining(0); setRunning(false)
    setIntervalLogs(activeProtocol.intervals.map(() => ({ wattsLow: '', wattsHigh: '', hr: '' })))
    setPhase('setup')
  }

  useEffect(() => {
    if (!running) return
    tick.current = setInterval(() => {
      setRemaining((r) => {
        if (r > 1) return r - 1
        // advance phase
        const intervals = activeProtocol.intervals
        if (inWork) {
          const restSec = intervals[curInterval].restSec
          if (restSec > 0) { setInWork(false); return restSec }
          // no rest — move to next interval
        }
        const next = curInterval + 1
        if (next >= intervals.length) {
          setRunning(false); setPhase('done'); return 0
        }
        setCurInterval(next); setInWork(true)
        buzz()
        return intervals[next].workSec
      })
    }, 1000)
    return () => clearInterval(tick.current)
  }, [running, curInterval, inWork])

  const startInterval = (i) => {
    const sec = activeProtocol.intervals[i].workSec
    setCurInterval(i); setInWork(true); setRemaining(sec); setRunning(true); setPhase('work')
  }

  const editLog = (i, k, v) => setIntervalLogs((p) => p.map((l, idx) => idx === i ? { ...l, [k]: v } : l))

  const save = () => {
    update((s) => {
      s.conditioningSessions = s.conditioningSessions || []
      s.conditioningSessions.push({
        id: `s_${Math.random().toString(36).slice(2,10)}`,
        type: 'echo-bike',
        date: new Date().toISOString(),
        data: {
          protocol: activeProtocol.id,
          intervalLogs,
          duration: summary.duration,
          hrAvg: summary.hrAvg ? parseInt(summary.hrAvg, 10) : null,
          hrMax: summary.hrMax ? parseInt(summary.hrMax, 10) : null,
        },
        note: summary.note,
      })
    })
    setSaved(true)
  }

  // History — last 6 echo bike sessions for watts trend
  const history = [...(state.conditioningSessions || [])]
    .filter((s) => s.type === 'echo-bike')
    .sort((a,b) => new Date(a.date) - new Date(b.date))
    .slice(-6)
  const wattsHighTrend = history.flatMap((s) =>
    (s.data?.intervalLogs || []).map((l) => parseFloat(l.wattsHigh) || 0)
  ).filter(Boolean).slice(-7)

  if (saved) return (
    <Card glow style={{ textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: 40 }}>🚴</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 10 }}>Echo bike session saved!</div>
      <p className="muted sm" style={{ marginTop: 6 }}>
        Protocol: {activeProtocol.name}
      </p>
    </Card>
  )

  return (
    <>
      {/* Protocol selector */}
      <Card glow style={{ '--h': 190 }}>
        <div className="row-between">
          <Label icon="bolt">Protocol</Label>
          {echoCount > 0 && (
            <span className="muted sm mono">Session #{echoCount + 1}</span>
          )}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>{activeProtocol.name}</div>
        <div className="muted sm" style={{ marginTop: 4 }}>{activeProtocol.desc}</div>
        <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--panel2)', borderRadius: 10, fontSize: 13, color: 'var(--accent)', border: '1px solid var(--line)' }}>
          {activeProtocol.note}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {Object.values(ECHO_PROTOCOLS).map((p) => (
            <button key={p.id}
              className={`opt sm ${(override || protocol.id) === p.id ? 'sel' : ''}`}
              onClick={() => { setOverride(p.id === protocol.id ? null : p.id); resetWorkout() }}>
              {p.name}
            </button>
          ))}
        </div>
      </Card>

      {/* Watts trend */}
      {wattsHighTrend.length >= 2 && (
        <Card>
          <Label icon="trend">Peak watts trend</Label>
          <Spark data={wattsHighTrend} w={300} h={48} dots fill />
          <div className="muted sm mono" style={{ marginTop: 4 }}>
            Last peak: {wattsHighTrend[wattsHighTrend.length - 1]}W
          </div>
        </Card>
      )}

      {/* Interval timer + logging */}
      {(phase === 'setup' || phase === 'work' || phase === 'done') && (
        <Card>
          <Label icon="clock">Intervals</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            {activeProtocol.intervals.map((iv, i) => {
              const isActive = phase === 'work' && curInterval === i
              const isPast = phase === 'done' || (phase === 'work' && i < curInterval)
              return (
                <IntervalRow key={i} iv={iv} idx={i} log={intervalLogs[i]}
                  isActive={isActive} isPast={isPast}
                  running={running && isActive} remaining={isActive ? remaining : null}
                  inWork={isActive ? inWork : null}
                  onStart={() => startInterval(i)}
                  onPause={() => setRunning((r) => !r)}
                  onEditLog={(k, v) => editLog(i, k, v)} />
              )
            })}
          </div>
          {phase === 'work' && (
            <div style={{ marginTop: 12 }}>
              <button className="btn" onClick={() => setRunning((r) => !r)}>
                {running ? 'Pause' : 'Resume'}
              </button>
            </div>
          )}
        </Card>
      )}

      {/* Post-session summary */}
      <Card>
        <Label icon="heart">Session summary (from Polar / watch)</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <div>
            <label className="lbl">Duration (min)</label>
            <input className="inp" type="text" placeholder="41:38"
              value={summary.duration} onChange={(e) => setSummary((p) => ({ ...p, duration: e.target.value }))} />
          </div>
          <div>
            <label className="lbl">HR avg (bpm)</label>
            <input className="inp" type="number" placeholder="143"
              value={summary.hrAvg} onChange={(e) => setSummary((p) => ({ ...p, hrAvg: e.target.value }))} />
          </div>
          <div>
            <label className="lbl">HR max (bpm)</label>
            <input className="inp" type="number" placeholder="187"
              value={summary.hrMax} onChange={(e) => setSummary((p) => ({ ...p, hrMax: e.target.value }))} />
          </div>
        </div>
        <label className="lbl" style={{ marginTop: 10 }}>Note</label>
        <textarea className="inp" style={{ minHeight: 60, resize: 'none' }}
          placeholder="Watts range, how it felt, last minutes push…"
          value={summary.note} onChange={(e) => setSummary((p) => ({ ...p, note: e.target.value }))} />
      </Card>

      <div className="sticky-actions">
        <button className="btn primary big" onClick={save}>
          <Icon name="check" size={16} stroke={2.4} /> Save session
        </button>
      </div>
    </>
  )
}

function IntervalRow({ iv, idx, log, isActive, isPast, running, remaining, inWork, onStart, onPause, onEditLog }) {
  const workMin = Math.floor(iv.workSec / 60)
  const restMin = Math.floor(iv.restSec / 60)
  const label = iv.label || `Interval ${idx + 1}`

  return (
    <div style={{
      border: `1px solid ${isActive ? 'var(--accent)' : isPast ? 'var(--line)' : 'var(--line)'}`,
      borderRadius: 12, overflow: 'hidden',
      background: isActive ? 'color-mix(in oklab, var(--accent) 8%, transparent)' : 'var(--panel2)',
      opacity: isPast ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
          <div className="muted sm mono">{workMin}min work{restMin > 0 ? ` / ${restMin}min rest` : ''}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isActive && running && (
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--mono)', color: inWork ? 'var(--accent)' : 'var(--muted)' }}>
              {formatTime(remaining)}
            </div>
          )}
          {isActive && running && (
            <span style={{ fontSize: 11, color: inWork ? 'var(--accent)' : 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              {inWork ? 'WORK' : 'REST'}
            </span>
          )}
          {!isActive && !isPast && (
            <button className="btn" style={{ padding: '6px 12px', fontSize: 13 }} onClick={onStart}>
              Start
            </button>
          )}
          {isPast && <Icon name="check" size={16} stroke={2.5} style={{ color: '#36e0a8' }} />}
        </div>
      </div>
      {/* Per-interval watts/HR log */}
      <div style={{ padding: '0 12px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div>
          <label className="lbl">Watts low</label>
          <input className="inp" type="number" placeholder="130"
            value={log.wattsLow} onChange={(e) => onEditLog('wattsLow', e.target.value)} />
        </div>
        <div>
          <label className="lbl">Watts high</label>
          <input className="inp" type="number" placeholder="280"
            value={log.wattsHigh} onChange={(e) => onEditLog('wattsHigh', e.target.value)} />
        </div>
        <div>
          <label className="lbl">HR max</label>
          <input className="inp" type="number" placeholder="182"
            value={log.hr} onChange={(e) => onEditLog('hr', e.target.value)} />
        </div>
      </div>
    </div>
  )
}

function formatTime(sec) {
  if (sec == null) return ''
  const m = Math.floor(sec / 60), s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function buzz() { try { navigator.vibrate && navigator.vibrate(200) } catch {} }
