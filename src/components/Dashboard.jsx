import { Icon } from '../lib/icons.jsx'
import { Card, Label, Spark } from '../lib/charts.jsx'
import {
  classifyBP, bpTrend, rollingAvg, weightTrendText,
  SLEEP_FACES, todaysMedKey,
} from '../data/health.js'
import { WORKOUT_TYPES } from '../data/conditioning.js'

// "Am I trending in the right direction?" — the synthesis dashboard.
export default function Dashboard({ state, goTo }) {
  const week = buildWeek(state)
  const tiles = buildHealthTiles(state)

  return (
    <>
      {/* ---- This week's training synthesis ---- */}
      <Card glow onClick={() => goTo('train')}>
        <div className="row-between">
          <Label icon="trend">This week</Label>
          <span className="muted sm mono">{week.done}/{week.planned} planned</span>
        </div>
        <div className="dash-week">
          {week.items.map((it) => (
            <div key={it.type} className="dash-day" title={it.name}>
              <div className="dash-day-dot" style={{
                background: it.done ? it.color : 'var(--line2)',
                boxShadow: it.done ? `0 0 calc(8px*var(--glow)) ${it.color}` : 'none',
                opacity: it.done ? 1 : 0.5,
              }}>{it.emoji}</div>
              <span className="dash-day-l">{it.short}</span>
            </div>
          ))}
        </div>
        <div className="track" style={{ marginTop: 10 }}>
          <div className="track-fill" style={{ width: `${week.planned ? Math.min(100, (week.done / week.planned) * 100) : 0}%` }} />
        </div>
      </Card>

      {/* ---- Health trend tiles ---- */}
      <div className="dash-grid">
        {tiles.map((t) => (
          <button key={t.key} className="dash-tile" onClick={() => goTo('vitals')}>
            <div className="dash-tile-top">
              <Icon name={t.icon} size={15} style={{ color: t.empty ? 'var(--muted)' : t.color }} />
              <span className="dash-tile-label">{t.label}</span>
            </div>
            {t.empty ? (
              <>
                <div className="dash-tile-empty">Log →</div>
                <div className="dash-tile-sub muted">No data yet</div>
              </>
            ) : (
              <>
                <div className="dash-tile-val mono">
                  {t.value}<span className="dash-tile-unit">{t.unit}</span>
                </div>
                <div className="dash-tile-sub" style={{ color: t.trendColor }}>
                  {t.trendIcon && <span>{t.trendIcon} </span>}{t.trendText}
                </div>
              </>
            )}
          </button>
        ))}
      </div>
    </>
  )
}

// ---- This week's training ----
function buildWeek(state) {
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0,0,0,0)

  const cond = (state.conditioningSessions || []).filter((s) => new Date(s.date) >= weekStart)
  const mob  = (state.sessions || []).filter((s) => new Date(s.date) >= weekStart)

  const schedule = state.schedule || []
  const items = schedule.map((slot) => {
    const wt = WORKOUT_TYPES[slot.type] || WORKOUT_TYPES.rest
    const done = cond.some((s) => s.type === slot.type)
    return {
      type: slot.type, name: wt.name, emoji: wt.emoji, color: wt.color,
      short: wt.name.split(' ')[0], done,
    }
  })

  // Mobility as an extra item
  const mobTarget = state.profile.weeklyTarget || 1
  if (mobTarget > 0) {
    items.push({
      type: 'mobility', name: 'Mobility', emoji: '🤸', color: '#2f6bff',
      short: 'Mobility', done: mob.length > 0,
    })
  }

  return {
    items,
    planned: items.length,
    done: items.filter((i) => i.done).length,
  }
}

// ---- Health metric tiles ----
function buildHealthTiles(state) {
  const tiles = []

  // Blood pressure
  const bpLogs = [...(state.bpLog || [])].sort((a,b) => new Date(a.date) - new Date(b.date))
  if (bpLogs.length) {
    const latest = bpLogs[bpLogs.length - 1]
    const cls = classifyBP(latest.sys, latest.dia)
    const tr = bpTrend(bpLogs)
    tiles.push({
      key: 'bp', label: 'Blood pressure', icon: 'drop',
      value: `${latest.sys}/${latest.dia}`, unit: '',
      color: cls?.color,
      trendText: tr ? tr.label : (cls?.badge || ''),
      trendColor: tr ? tr.color : cls?.color,
      trendIcon: null,
    })
  } else {
    tiles.push({ key: 'bp', label: 'Blood pressure', icon: 'drop', empty: true })
  }

  // Sleep
  const sleepLogs = [...(state.sleepLog || [])].sort((a,b) => new Date(a.date) - new Date(b.date))
  if (sleepLogs.length) {
    const last = sleepLogs[sleepLogs.length - 1]
    const recent = sleepLogs.slice(-7).map((l) => l.durationHours || 0)
    const avg = recent.reduce((a,b) => a+b,0) / recent.length
    const good = avg >= 7
    tiles.push({
      key: 'sleep', label: 'Sleep (7d avg)', icon: 'moon',
      value: Math.round(avg * 10) / 10, unit: 'h',
      color: good ? '#36e0a8' : '#f5a524',
      trendText: `last ${last.durationHours}h ${SLEEP_FACES[last.quality] || ''}`,
      trendColor: 'var(--muted)',
      trendIcon: null,
    })
  } else {
    tiles.push({ key: 'sleep', label: 'Sleep', icon: 'moon', empty: true })
  }

  // Weight
  const wtLogs = [...(state.weightLog || [])].sort((a,b) => new Date(a.date) - new Date(b.date))
  if (wtLogs.length) {
    const avg7 = rollingAvg(wtLogs, 7)
    const tr = weightTrendText(wtLogs)
    tiles.push({
      key: 'weight', label: 'Weight (7d avg)', icon: 'trend',
      value: avg7, unit: 'lb',
      color: 'var(--accent)',
      trendText: tr ? tr.label.replace(' (7d avg)', '') : 'tracking',
      trendColor: tr ? tr.color : 'var(--muted)',
      trendIcon: null,
    })
  } else {
    tiles.push({ key: 'weight', label: 'Weight', icon: 'trend', empty: true })
  }

  // Medications today
  const meds = state.medications || []
  if (meds.length) {
    const todayKey = todaysMedKey()
    const todayLog = state.medLog?.[todayKey] || {}
    const allDoses = meds.flatMap((m) => m.doses.map((d) => ({ key: `${m.id}-${d.id}` })))
    const taken = allDoses.filter((d) => todayLog[d.key]?.taken).length
    const all = taken === allDoses.length
    tiles.push({
      key: 'meds', label: 'Meds today', icon: 'shield',
      value: `${taken}/${allDoses.length}`, unit: '',
      color: all ? '#36e0a8' : '#f5a524',
      trendText: all ? 'all taken ✓' : 'pending',
      trendColor: all ? '#36e0a8' : '#f5a524',
      trendIcon: null,
    })
  } else {
    tiles.push({ key: 'meds', label: 'Medications', icon: 'shield', empty: true })
  }

  return tiles
}
