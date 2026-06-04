// =============================================================================
//  HEALTH DATA MODEL
//  BP classification (AHA guidelines), sleep helpers, rolling averages.
// =============================================================================

// ---- Blood pressure classification ----
export function classifyBP(sys, dia) {
  if (!sys || !dia) return null
  if (sys > 180 || dia > 120) return { label: 'Crisis',    color: '#ff3b3b', badge: 'CRISIS'   }
  if (sys >= 140 || dia >= 90) return { label: 'High 2',   color: '#ff6b35', badge: 'HIGH'     }
  if (sys >= 130 || dia >= 80) return { label: 'High 1',   color: '#f5a524', badge: 'ELEVATED' }
  if (sys >= 120 && dia < 80)  return { label: 'Elevated', color: '#f5c842', badge: 'WATCH'    }
  return                               { label: 'Normal',   color: '#36e0a8', badge: 'OPTIMAL'  }
}

// ---- BP trend label ----
export function bpTrend(logs) {
  if (logs.length < 3) return null
  const recent = logs.slice(-3)
  const avgSys = recent.reduce((n, l) => n + l.sys, 0) / 3
  const older  = logs.slice(-7, -3)
  if (!older.length) return null
  const prevSys = older.reduce((n, l) => n + l.sys, 0) / older.length
  const diff = avgSys - prevSys
  if (Math.abs(diff) < 2) return { dir: 'stable', label: 'Stable', color: '#36e0a8' }
  if (diff > 0) return { dir: 'up', label: `▲ ${Math.round(diff)} mmHg`, color: '#f5a524' }
  return        { dir: 'down', label: `▼ ${Math.abs(Math.round(diff))} mmHg`, color: '#36e0a8' }
}

// ---- Rolling average ----
export function rollingAvg(logs, n = 7) {
  if (!logs.length) return null
  const recent = logs.slice(-n)
  return Math.round(recent.reduce((s, l) => s + l.weight, 0) / recent.length * 10) / 10
}

// ---- Sleep duration from bedtime + wake ----
export function sleepDuration(bedtime, wakeTime) {
  if (!bedtime || !wakeTime) return null
  const [bh, bm] = bedtime.split(':').map(Number)
  const [wh, wm] = wakeTime.split(':').map(Number)
  let mins = (wh * 60 + wm) - (bh * 60 + bm)
  if (mins < 0) mins += 24 * 60  // crossed midnight
  return Math.round(mins / 6) / 10  // hours, 1dp
}

// ---- Sleep quality label ----
export const SLEEP_FACES = ['', '😞', '😕', '😐', '🙂', '😄']
export const SLEEP_LABELS = ['', 'Rough', 'Poor', 'Okay', 'Good', 'Great']

// ---- Medication schedule helpers ----
export function todaysMedKey() {
  return new Date().toISOString().slice(0, 10)
}

export function medComplianceStreak(medLog, medId) {
  if (!medLog || !medId) return 0
  let streak = 0
  const d = new Date(); d.setHours(0,0,0,0)
  while (true) {
    const key = d.toISOString().slice(0, 10)
    const dayLogs = medLog[key] || {}
    // Check at least one dose taken for this med on this day
    const taken = Object.values(dayLogs).some((entry) => entry.medId === medId && entry.taken)
    if (!taken) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

// ---- Weight trend description ----
export function weightTrendText(logs) {
  if (logs.length < 2) return null
  const cur = rollingAvg(logs, 7)
  const prev = (() => {
    if (logs.length < 8) return null
    const older = logs.slice(-14, -7)
    if (!older.length) return null
    return Math.round(older.reduce((s, l) => s + l.weight, 0) / older.length * 10) / 10
  })()
  if (!prev || !cur) return null
  const diff = Math.round((cur - prev) * 10) / 10
  if (Math.abs(diff) < 0.2) return { label: 'Holding steady', color: '#36e0a8', diff: 0 }
  return {
    label: diff > 0 ? `▲ ${diff} lb (7d avg)` : `▼ ${Math.abs(diff)} lb (7d avg)`,
    color: diff > 0 ? '#f5a524' : '#36e0a8',
    diff,
  }
}
