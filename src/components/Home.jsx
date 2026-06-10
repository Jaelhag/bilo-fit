import { Icon } from '../lib/icons.jsx'
import { Ring, Card, Label } from '../lib/charts.jsx'
import { nextDue } from '../lib/engine.js'
import { GOALS } from '../data/library.js'
import { todaysWorkout, WORKOUT_TYPES } from '../data/conditioning.js'
import Dashboard from './Dashboard.jsx'

const TODAY = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

export default function Home({ state, update, activeGoal, goTo }) {
  const program  = state.programs[activeGoal.id]
  const sessions = state.sessions.filter((s) => s.goalId === activeGoal.id)
  const last     = sessions[sessions.length - 1]
  const due      = nextDue(last, state.profile.weeklyTarget || 1)
  const todayCondType = todaysWorkout(state.schedule || [])

  // Zone 2 this week
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0,0,0,0)
  const z2Min  = (state.conditioningSessions || []).filter((s) => new Date(s.date) >= weekStart && s.data?.zone2Min).reduce((n,s) => n + (s.data.zone2Min || 0), 0)
  const z2Goal = state.zone2WeeklyGoal || 180

  // Recovery score: 100 if never trained, decays based on soreness, peaks when due
  const recovScore = (() => {
    if (!last) return 88
    if (!due)  return 88
    const daysLeft = Math.ceil((new Date(due.due) - new Date()) / 86400000)
    if (daysLeft <= 0) return 92
    return Math.max(40, 100 - daysLeft * 12)
  })()

  const readinessNote = recovScore >= 90 ? 'Primed to train' : recovScore >= 70 ? 'Almost recovered' : 'Let the body rest'
  const totalSessions = state.sessions.length
  const streak = calcStreak(state.sessions)

  // Goals that have programs
  const activeGoals = GOALS.filter((g) => state.programs[g.id])

  return (
    <div className="screen">
      {/* Brand wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '2px 2px 0' }}>
        <Icon name="bolt" size={16} stroke={2.2} style={{ color: 'var(--accent)' }} />
        <span style={{ fontWeight: 700, letterSpacing: '.18em', fontSize: 13, color: 'var(--accent)' }}>BILO FIT</span>
      </div>

      {/* Header */}
      <header className="hd">
        <div>
          <div className="hd-hi">{greeting()}, {state.profile.name || 'Jordan'}</div>
          <div className="hd-sub mono">{TODAY.toUpperCase()}</div>
        </div>
        {streak > 0 && (
          <div className="streak">
            <Icon name="flame" size={14} stroke={2} />
            <span className="mono">{streak}</span>
          </div>
        )}
      </header>

      {/* Recovery / Readiness hero */}
      <Card glow className="hero">
        <div>
          <Ring value={recovScore / 100} size={104} stroke={9} label={recovScore} sub="READY" />
        </div>
        <div className="hero-r">
          <Label icon="bolt">Recovery</Label>
          <div className="hero-note">{readinessNote}</div>
          <div className="kv-row">
            <div className="kv">
              <span className="kv-k">SESSIONS</span>
              <span className="kv-v mono">{totalSessions}</span>
            </div>
            <div className="kv">
              <span className="kv-k">GOALS</span>
              <span className="kv-v mono">{activeGoals.length}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Dashboard synthesis — "am I trending the right way?" */}
      <Dashboard state={state} goTo={goTo} />

      {/* Today's conditioning workout */}
      {todayCondType.id !== 'rest' && (
        <Card glow className="tap" onClick={() => goTo('train')}
          style={{ borderColor: `${todayCondType.color}44` }}>
          <div className="row-between">
            <Label icon="bolt">Today · Conditioning</Label>
            <span className="pill" style={{ color: todayCondType.color, borderColor: `${todayCondType.color}55` }}>
              {todayCondType.emoji} {todayCondType.name}
            </span>
          </div>
          <div className="cta" style={{ marginTop: 8 }}>
            Open {todayCondType.name} <Icon name="chevron" size={16} stroke={2.2} />
          </div>
        </Card>
      )}

      {/* Zone 2 weekly progress */}
      <Card onClick={() => goTo('train')}>
        <div className="row-between">
          <Label icon="run">Zone 2 this week</Label>
          <span className="muted sm mono">{z2Min} / {z2Goal} min</span>
        </div>
        <div className="track" style={{ marginTop: 8 }}>
          <div className="track-fill" style={{ width: `${Math.min(100, (z2Min / z2Goal) * 100)}%` }} />
        </div>
      </Card>

      {/* 3-stat grid */}
      <div className="grid3">
        <Card className="stat" onClick={() => goTo('history')}>
          <Icon name="history" size={17} className="stat-i" />
          <div className="stat-v mono">{totalSessions}</div>
          <div className="stat-l">Sessions</div>
        </Card>
        <Card className="stat" onClick={() => goTo('goals')}>
          <Icon name="goals" size={17} className="stat-i" />
          <div className="stat-v mono">{activeGoals.length}</div>
          <div className="stat-l">Programs</div>
        </Card>
        <Card className="stat" onClick={() => goTo('goals')}>
          <Icon name="flame" size={17} className="stat-i" />
          <div className="stat-v mono">{streak}</div>
          <div className="stat-l">Streak</div>
        </Card>
      </div>

      {/* Today's session or CTA */}
      {!program ? (
        <Card glow className="today" onClick={() => goTo('assess')}>
          <div className="today-top">
            <Label icon="bolt">{activeGoal.emoji} {activeGoal.name}</Label>
          </div>
          <div className="today-title">Build your program</div>
          <div className="today-ex">Answer 3–5 questions and I'll assemble your {activeGoal.name} routine.</div>
          <div className="cta">Start assessment <Icon name="chevron" size={16} stroke={2.2} /></div>
        </Card>
      ) : (
        <Card glow className="today" onClick={() => goTo('train')}>
          <div className="today-top">
            <Label icon="train">Today · {activeGoal.emoji} {activeGoal.name}</Label>
            <span className="pill">{program.length} drills</span>
          </div>
          <div className="today-title">{drillSummary(program)}</div>
          <div className="today-ex mono">
            {program.slice(0, 3).map((d) => d.name).join('  ·  ')}
            {program.length > 3 && <span className="muted"> +{program.length - 3}</span>}
          </div>
          {dueText(due) && (
            <div className="muted sm mono" style={{ marginTop: 4 }}>{dueText(due)}</div>
          )}
          <div className="cta">Start session <Icon name="chevron" size={16} stroke={2.2} /></div>
        </Card>
      )}

      {/* Other active goals */}
      {activeGoals.length > 1 && (
        <>
          <div className="sec-head">
            <Label icon="goals">Other programs</Label>
            <button className="link-btn" onClick={() => goTo('goals')}>All goals</button>
          </div>
          {activeGoals.filter((g) => g.id !== activeGoal.id).slice(0, 2).map((g) => {
            const p = state.programs[g.id]
            const gs = state.sessions.filter((s) => s.goalId === g.id)
            const gl = gs[gs.length - 1]
            const gd = nextDue(gl, state.profile.weeklyTarget || 1)
            return (
              <Card key={g.id} className="today tap" onClick={() => {
                update((s) => { s.activeGoal = g.id })
                goTo('train')
              }}>
                <div className="row-between">
                  <div>
                    <Label>{g.emoji} {g.name}</Label>
                    <div className="muted sm" style={{ marginTop: 4 }}>
                      {p.length} drills · {gs.length} sessions done
                    </div>
                  </div>
                  <Icon name="chevron" size={18} stroke={2} className="muted" />
                </div>
              </Card>
            )
          })}
        </>
      )}

      <div className="botpad" />
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function drillSummary(program) {
  const types = [...new Set(program.map((d) => {
    const t = d.type
    if (t === 'technique') return 'Technique'
    if (t === 'loaded-stretch') return 'Loaded'
    if (t === 'contract-relax') return 'Contract–relax'
    if (t === 'isometric') return 'Isometric'
    return 'Active'
  }))]
  return types.slice(0, 2).join(' + ')
}

function dueText(due) {
  if (!due) return null
  const days = Math.ceil((new Date(due.due) - new Date()) / 86400000)
  if (days <= 0) return "You're recovered — train today"
  return `Ready in ~${days} day${days === 1 ? '' : 's'}`
}

function calcStreak(sessions) {
  if (!sessions.length) return 0
  const sorted = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date))
  let streak = 0
  let prev = new Date()
  prev.setHours(0,0,0,0)
  for (const s of sorted) {
    const d = new Date(s.date)
    d.setHours(0,0,0,0)
    const diff = Math.round((prev - d) / 86400000)
    if (diff <= 2) { streak++; prev = d } else break
  }
  return streak
}
