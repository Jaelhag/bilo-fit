import { useState } from 'react'
import { Icon } from '../lib/icons.jsx'
import { Card, Label, Ring, DateField, todayStr, dateToISO } from '../lib/charts.jsx'
import { WORKOUT_TYPES, todaysWorkout } from '../data/conditioning.js'
import Session from './Session.jsx'
import ExplosiveDay from './conditioning/ExplosiveDay.jsx'
import LiftDay from './conditioning/LiftDay.jsx'
import EchoBikeDay from './conditioning/EchoBikeDay.jsx'

const TABS = [
  { id: 'today', label: "Today", icon: 'bolt' },
  { id: 'mobility', label: 'Mobility', icon: 'train' },
  { id: 'explosive', label: 'Explosive', icon: 'bolt' },
  { id: 'lift', label: 'Lift', icon: 'train' },
  { id: 'cardio', label: 'Cardio', icon: 'run' },
]

export default function TrainHub({ state, update, activeGoal, goTo }) {
  const todayType = todaysWorkout(state.schedule || [])
  const [tab, setTab] = useState('today')

  // Count echo bike sessions to determine next protocol
  const echoBikeSessions = (state.conditioningSessions || []).filter((s) => s.type === 'echo-bike').length

  // Derive "today" tab content
  function TodayContent() {
    if (todayType.id === 'rest') {
      return (
        <Card glow style={{ textAlign: 'center', padding: '28px 20px' }}>
          <div style={{ fontSize: 40 }}>😴</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 10 }}>Rest Day</div>
          <p className="muted sm" style={{ marginTop: 8 }}>
            Recovery is training. Pick another tab to log something anyway, or just rest.
          </p>
        </Card>
      )
    }
    if (todayType.id === 'explosive') return <ExplosiveDay state={state} update={update} goTo={goTo} />
    if (todayType.id === 'upper-lift') return <LiftDay type="upper" state={state} update={update} />
    if (todayType.id === 'lower-lift') return <LiftDay type="lower" state={state} update={update} />
    if (todayType.id === 'echo-bike')  return <EchoBikeDay state={state} update={update} echoCount={echoBikeSessions} />
    if (todayType.id === 'mobility')   return <Session state={state} update={update} activeGoal={activeGoal} goTo={goTo} />
    return null
  }

  // weekly zone2 minutes
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0,0,0,0)
  const z2Min = (state.conditioningSessions || [])
    .filter((s) => new Date(s.date) >= weekStart && s.data?.zone2Min)
    .reduce((n, s) => n + (s.data.zone2Min || 0), 0)
  const z2Goal = state.zone2WeeklyGoal || 180

  return (
    <div className="screen">
      <header className="hd">
        <div>
          <div className="hd-hi">Train</div>
          <div className="hd-sub mono">
            {todayType.emoji} {todayType.name.toUpperCase()}
          </div>
        </div>
        {/* Zone 2 weekly mini */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.1em' }}>ZONE 2</div>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--accent)' }}>
            {z2Min}<span style={{ fontSize: 11, color: 'var(--muted)' }}> / {z2Goal} min</span>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="seg" style={{ overflowX: 'auto' }}>
        {TABS.map((t) => (
          <button key={t.id} className={`seg-b ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
            {t.id === 'today' ? `${todayType.emoji} Today` : t.label}
          </button>
        ))}
      </div>

      {tab === 'today'    && <TodayContent />}
      {tab === 'mobility' && <Session state={state} update={update} activeGoal={activeGoal} goTo={goTo} />}
      {tab === 'explosive'&& <ExplosiveDay state={state} update={update} goTo={goTo} />}
      {tab === 'lift'     && <LiftSelector state={state} update={update} />}
      {tab === 'cardio'   && <CardioHub state={state} update={update} echoBikeSessions={echoBikeSessions} />}

      <div className="botpad" />
    </div>
  )
}

function LiftSelector({ state, update }) {
  const [type, setType] = useState('upper')
  return (
    <>
      <div className="seg">
        <button className={`seg-b ${type === 'upper' ? 'on' : ''}`} onClick={() => setType('upper')}>Upper</button>
        <button className={`seg-b ${type === 'lower' ? 'on' : ''}`} onClick={() => setType('lower')}>Lower</button>
      </div>
      <LiftDay type={type} state={state} update={update} />
    </>
  )
}

function CardioHub({ state, update, echoBikeSessions }) {
  const [type, setType] = useState('echo')
  return (
    <>
      <div className="seg">
        <button className={`seg-b ${type === 'echo' ? 'on' : ''}`} onClick={() => setType('echo')}>Echo Bike</button>
        <button className={`seg-b ${type === 'z2' ? 'on' : ''}`} onClick={() => setType('z2')}>Zone 2</button>
      </div>
      {type === 'echo' && <EchoBikeDay state={state} update={update} echoCount={echoBikeSessions} />}
      {type === 'z2'   && <Zone2Logger  state={state} update={update} />}
    </>
  )
}

function Zone2Logger({ state, update }) {
  const [minutes, setMinutes] = useState('')
  const [note, setNote]       = useState('')
  const [saved, setSaved]     = useState(false)
  const [logDate, setLogDate] = useState(todayStr())

  const z2Goal = state.zone2WeeklyGoal || 180

  // This week's sessions
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0,0,0,0)
  const weekSessions = (state.conditioningSessions || [])
    .filter((s) => new Date(s.date) >= weekStart && s.data?.zone2Min)
    .sort((a,b) => new Date(b.date) - new Date(a.date))
  const z2Done = weekSessions.reduce((n, s) => n + (s.data.zone2Min || 0), 0)

  const save = () => {
    if (!minutes) return
    update((s) => {
      s.conditioningSessions = s.conditioningSessions || []
      s.conditioningSessions.push({
        id: `s_${Math.random().toString(36).slice(2,10)}`,
        type: 'zone2',
        date: dateToISO(logDate),
        data: { zone2Min: parseInt(minutes, 10) },
        note,
      })
    })
    setSaved(true)
  }

  if (saved) return (
    <Card glow style={{ textAlign: 'center', padding: 28 }}>
      <div style={{ fontSize: 36 }}>✓</div>
      <div style={{ fontWeight: 700, marginTop: 8 }}>Logged {minutes} min Zone 2</div>
    </Card>
  )

  return (
    <>
      <Card glow>
        <Label icon="run">Zone 2 this week</Label>
        <div className="big-stat">
          <span className="mono big2">{z2Done}</span>
          <span className="muted"> / {z2Goal} min</span>
        </div>
        <div className="track lg" style={{ marginTop: 8 }}>
          <div className="track-fill" style={{ width: `${Math.min(100, (z2Done / z2Goal) * 100)}%` }} />
        </div>
      </Card>

      {weekSessions.length > 0 && (
        <Card>
          <Label icon="history">This week</Label>
          <div className="listy">
            {weekSessions.map((s) => (
              <div key={s.id} className="listy-row">
                <span>{fmtDate(s.date)}</span>
                <span className="muted sm mono">{s.data.zone2Min} min{s.note ? ` · ${s.note}` : ''}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <Label icon="run">Log a session</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          <DateField value={logDate} onChange={setLogDate} label="Date" />
          <div>
            <label className="lbl">Duration (minutes)</label>
            <input className="inp" type="number" min="1" placeholder="e.g. 45"
              value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          </div>
          <div>
            <label className="lbl">Note (optional)</label>
            <input className="inp" type="text" placeholder="e.g. brisk walk uphill"
              value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <button className="btn primary big" disabled={!minutes} onClick={save}>
            <Icon name="check" size={16} stroke={2.4} /> Save Zone 2
          </button>
        </div>
      </Card>
    </>
  )
}

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) }
  catch { return iso }
}
