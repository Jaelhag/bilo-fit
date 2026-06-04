// =============================================================================
//  STORAGE
//  Everything saves locally on the device. Backup/Restore moves a single file
//  between devices (the manual-sync bridge until automatic sync is wired up).
// =============================================================================

const KEY = 'mobility-coach-v2'

const BLANK = {
  version: 2,
  profile: { name: '', weeklyTarget: 1 },
  activeGoal: 'side-split',

  // ---- Mobility ----
  assessments: {},  // goalId -> { answers, generatedAt }
  programs: {},     // goalId -> [ program items ]
  sessions: [],     // mobility sessions

  // ---- Conditioning ----
  // Weekly schedule: [{ dow: 1, type: 'explosive' }, ...]
  schedule: [
    { dow: 1, type: 'explosive'   },
    { dow: 2, type: 'upper-lift'  },
    { dow: 4, type: 'lower-lift'  },
    { dow: 5, type: 'echo-bike'   },
  ],

  // conditioningSessions: [{ id, type, date, data:{...}, note }]
  conditioningSessions: [],

  // liftProgress: { 'bench': [{ date, weight, reps, e1rm }], ... }
  liftProgress: {},

  // Zone 2 weekly goal in minutes
  zone2WeeklyGoal: 180,

  // ---- Health tracking ----
  // bpLog: [{ id, date, sys, dia, pulse, note }]
  bpLog: [],

  // sleepLog: [{ id, date, bedtime, wakeTime, durationHours, quality(1-5), disruptions(bool), note }]
  sleepLog: [],

  // weightLog: [{ id, date, weight (lb), note }]
  weightLog: [],

  // medications: [{ id, name, color, doses: [{ id, time, label }] }]
  medications: [],

  // medLog: { 'YYYY-MM-DD': { '[medId]-[doseId]': { medId, doseId, taken, takenAt } } }
  medLog: {},

  settings: { updatedAt: null },
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return structuredClone(BLANK)
    const data = JSON.parse(raw)
    return { ...structuredClone(BLANK), ...data }
  } catch {
    return structuredClone(BLANK)
  }
}

export function save(state) {
  const next = { ...state, settings: { ...state.settings, updatedAt: new Date().toISOString() } }
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function exportFile(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `mobility-coach-backup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!data || typeof data !== 'object') throw new Error('Not a valid backup file.')
        resolve({ ...structuredClone(BLANK), ...data })
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.readAsText(file)
  })
}

export function newId() {
  return 's_' + Math.random().toString(36).slice(2, 10)
}
