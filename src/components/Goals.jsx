import { Icon } from '../lib/icons.jsx'
import { Ring, Card, Label } from '../lib/charts.jsx'
import { GOALS } from '../data/library.js'

// Hue per goal for the coloured left-border accent
const GOAL_HUE = {
  'side-split':  200,
  'pancake':     270,
  'front-split': 160,
  'pike':        35,
  'shoulder':    220,
  'bridge':      330,
}

export default function Goals({ state, update, activeGoal, goTo }) {
  const programmed = GOALS.filter((g) => state.programs[g.id])
  const unprogrammed = GOALS.filter((g) => !state.programs[g.id])

  const activate = (goalId) => {
    update((s) => { s.activeGoal = goalId })
    goTo('assess')
  }
  const openTrain = (goalId) => {
    update((s) => { s.activeGoal = goalId })
    goTo('train')
  }

  return (
    <div className="screen">
      <header className="hd"><div className="hd-hi">Goals</div></header>

      {/* Active programs */}
      {programmed.map((g) => {
        const p = state.programs[g.id]
        const sessions = state.sessions.filter((s) => s.goalId === g.id)
        const hue = GOAL_HUE[g.id] || 220
        const pct = Math.min(1, sessions.length / 24) // rough 24-session phase estimate
        const last = sessions[sessions.length - 1]

        return (
          <Card key={g.id} glow className="prog tap" style={{ '--h': hue }}
            onClick={() => openTrain(g.id)}>
            <div className="prog-head">
              <div>
                <div className="prog-name">{g.emoji} {g.name}</div>
                <div className="muted sm mono">Mobility Coach · {sessions.length} sessions</div>
              </div>
              <Ring value={pct} size={50} stroke={6}
                label={`${Math.round(pct * 100)}%`}
                color="color-mix(in oklab, var(--accent) 78%, white 22%)"
                glow={false} />
            </div>

            {p.length > 0 && (
              <div className="prog-next">
                <span className="muted">NEXT</span>
                <span className="prog-next-t">
                  {p[0].slot} — {p[0].name}
                </span>
              </div>
            )}

            <div className="prog-foot">
              <span className="muted sm mono">
                {last ? `Last: ${fmtDate(last.date)}` : 'Not started yet'}
              </span>
              <span className="pill ghost">
                Train <Icon name="chevron" size={13} stroke={2.4} />
              </span>
            </div>
          </Card>
        )
      })}

      {/* Unlock more goals */}
      {unprogrammed.length > 0 && (
        <>
          <div className="sec-head">
            <Label icon="link">Add a goal</Label>
          </div>
          <div className="row-scroll">
            {unprogrammed.map((g) => {
              const hue = GOAL_HUE[g.id] || 220
              return (
                <div key={g.id} className="mkt tap" style={{ '--h': hue, cursor: 'pointer' }}
                  onClick={() => activate(g.id)}>
                  <div className="mkt-art">
                    <div className="thumb-stripes" />
                    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 28 }}>
                      {g.emoji}
                    </div>
                  </div>
                  <div className="mkt-t">{g.name}</div>
                  <div className="muted sm mono">{g.blurb}</div>
                  {g.status === 'draft' && <div className="muted sm" style={{ marginTop: 2, fontSize: 11 }}>Draft — starts you with standard numbers</div>}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Re-assess any program */}
      {programmed.length > 0 && (
        <>
          <div className="sec-head">
            <Label icon="bolt">Re-assess a program</Label>
          </div>
          <div className="opts tight" style={{ marginTop: 0 }}>
            {programmed.map((g) => (
              <button key={g.id} className="opt sm"
                onClick={() => { update((s) => { s.activeGoal = g.id }); goTo('assess') }}>
                {g.emoji} {g.name}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="botpad" />
    </div>
  )
}

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
  catch { return iso }
}
