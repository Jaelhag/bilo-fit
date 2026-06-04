// =============================================================================
//  CONDITIONING DATA MODEL
//  Jordan's 4-day weekly rotation:
//   • Explosive — dynamic warm-up + sprints/plyos
//   • Upper Lift + Zone 2 walk
//   • Lower Lift + Zone 2 walk
//   • Echo Bike — alternates Norwegian 4×4 ↔ 1min on/1min off
// =============================================================================

export const WORKOUT_TYPES = {
  explosive:   { id: 'explosive',   name: 'Explosive Day',       emoji: '⚡', hue: 38,  color: '#f5a524' },
  'upper-lift': { id: 'upper-lift', name: 'Upper Lift + Zone 2', emoji: '💪', hue: 220, color: '#2f6bff' },
  'lower-lift': { id: 'lower-lift', name: 'Lower Lift + Zone 2', emoji: '🦵', hue: 280, color: '#9b6bff' },
  'echo-bike':  { id: 'echo-bike',  name: 'Echo Bike',           emoji: '🚴', hue: 190, color: '#19e6c0' },
  mobility:    { id: 'mobility',    name: 'Mobility',             emoji: '🤸', hue: 200, color: '#2f6bff' },
  rest:        { id: 'rest',        name: 'Rest / Recovery',      emoji: '😴', hue: 0,   color: '#7f8aa8' },
}

// Default weekly rotation — user can edit in Settings.
// dow: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
export const DEFAULT_SCHEDULE = [
  { dow: 1, type: 'explosive'  },
  { dow: 2, type: 'upper-lift' },
  { dow: 4, type: 'lower-lift' },
  { dow: 5, type: 'echo-bike'  },
]

// ---- Echo bike protocols ----
export const ECHO_PROTOCOLS = {
  '4x4': {
    id: '4x4',
    name: 'Norwegian 4×4',
    desc: '4 intervals of 4 min hard / 3 min easy recovery',
    intervals: [
      { label: 'Interval 1', workSec: 240, restSec: 180 },
      { label: 'Interval 2', workSec: 240, restSec: 180 },
      { label: 'Interval 3', workSec: 240, restSec: 180 },
      { label: 'Interval 4', workSec: 240, restSec: 0   },
    ],
    targetHRPct: '85–95%',
    note: 'Hit 85-95% max HR during work. RPE 8-9. Last interval all-out.',
  },
  '1min': {
    id: '1min',
    name: '1 min on / 1 min off',
    desc: '8–10 rounds of 1 min max effort / 1 min easy',
    intervals: Array.from({ length: 10 }, (_, i) => ({
      label: `Round ${i + 1}`,
      workSec: 60,
      restSec: 60,
    })),
    targetHRPct: '90–100%',
    note: 'Max effort every work interval. Push watts as high as sustainable.',
  },
}

// ---- Lift exercise library ----
export const LIFTS = {
  upper: [
    { id: 'bench',        name: 'Bench Press',         scheme: '3–5 × 5–8',  tag: 'Chest',    primary: true  },
    { id: 'incline-db',   name: 'Incline DB Press',    scheme: '3 × 8–12',   tag: 'Chest'  },
    { id: 'cable-fly',    name: 'Cable Fly / Pec Deck',scheme: '3 × 12–15',  tag: 'Chest'  },
    { id: 'row',          name: 'Barbell / Cable Row',  scheme: '3–4 × 6–10', tag: 'Back',     primary: true  },
    { id: 'pullup',       name: 'Pull-ups / Lat PD',    scheme: '3 × max',    tag: 'Back'   },
    { id: 'ohp',          name: 'Overhead Press',       scheme: '3 × 6–8',    tag: 'Shoulder', primary: true  },
    { id: 'lateral',      name: 'Lateral Raises',       scheme: '3 × 12–15',  tag: 'Shoulder'},
    { id: 'triceps',      name: 'Triceps (pushdown/ext)',scheme: '2–3 × 12',  tag: 'Arms'   },
    { id: 'biceps',       name: 'Biceps (curl)',         scheme: '2–3 × 12',  tag: 'Arms'   },
  ],
  lower: [
    { id: 'squat',        name: 'Squat (Back/Front)',   scheme: '4 × 3–6',    tag: 'Quads',    primary: true  },
    { id: 'deadlift',     name: 'Deadlift',             scheme: '3–4 × 3–5',  tag: 'Posterior',primary: true  },
    { id: 'rdl',          name: 'Romanian Deadlift',    scheme: '3 × 8',      tag: 'Hamstring',primary: true  },
    { id: 'bss',          name: 'Bulgarian Split Squat',scheme: '3 × 8–10/side',tag: 'Quads'  },
    { id: 'hip-thrust',   name: 'Hip Thrust',           scheme: '3 × 8–12',   tag: 'Glutes'  },
    { id: 'leg-curl',     name: 'Leg Curl',             scheme: '3 × 10–12',  tag: 'Hamstring'},
    { id: 'calf',         name: 'Standing Calf Raise',  scheme: '4 × 12–15',  tag: 'Calves'  },
    { id: 'leg-press',    name: 'Leg Press',            scheme: '3 × 10–15',  tag: 'Quads'   },
  ],
}

// ---- Sprint / explosive warm-up sequence ----
export const SPRINT_WARMUP = [
  {
    section: 'General Warm-Up',
    items: [
      { id: 'gw-walk',    name: '5–10 min brisk walk (uphill or flat)' },
    ],
  },
  {
    section: 'Dynamic Prep',
    items: [
      { id: 'dp-butt',    name: 'Butt kicks',        detail: '20 yd' },
      { id: 'dp-shuffle', name: 'Small shuffles',    detail: '20 yd' },
      { id: 'dp-hurdle',  name: 'Hurdle walks',      detail: '' },
      { id: 'dp-swing',   name: 'Leg swings',        detail: '' },
      { id: 'dp-skip',    name: 'Light skips',       detail: '' },
      { id: 'dp-vup',     name: 'V ups',             detail: '' },
      { id: 'dp-stretch', name: 'Stretch holds',     detail: '' },
    ],
  },
  {
    section: 'Elastic Prep',
    note: 'Keep low volume',
    items: [
      { id: 'el-fwd',     name: 'Line hops forward/back', detail: '×10' },
      { id: 'el-side',    name: 'Line hops side/side',    detail: '×10' },
      { id: 'el-pogo2',   name: 'Double-leg pogo hops',   detail: '×10' },
      { id: 'el-pogo1',   name: 'Single-leg pogos',       detail: '×5 each' },
    ],
  },
]

// ---- Sprint work presets ----
export const SPRINT_WORK = [
  { id: 'hill-10s',  name: 'Hill sprints (10 sec)',    default: { sets: 3, rpe: '7.5–8', recovery: 'Walk down' } },
  { id: 'stride100', name: '100 m strides',            default: { sets: 2, rpe: '70–80%', recovery: '90s walk' } },
  { id: 'fly60',     name: '60 m fly sprints',         default: { sets: 4, rpe: 'max',   recovery: '3 min' } },
  { id: 'hill-6',    name: 'Hill sprints (6 sec)',      default: { sets: 6, rpe: 'max',   recovery: 'Walk down' } },
  { id: 'accel20',   name: 'Acceleration 20 m',        default: { sets: 8, rpe: 'max',   recovery: '90s' } },
  { id: 'custom',    name: 'Custom',                   default: { sets: 1, rpe: '', recovery: '' } },
]

// Epley e1RM formula: weight × (1 + reps/30)
export function calcE1RM(weight, reps) {
  if (!weight || !reps || reps < 1) return 0
  return Math.round(weight * (1 + reps / 30))
}

// Next echo bike protocol: alternates 4x4 ↔ 1min based on session count
export function nextEchoProtocol(priorEchoSessions = 0) {
  return priorEchoSessions % 2 === 0 ? ECHO_PROTOCOLS['4x4'] : ECHO_PROTOCOLS['1min']
}

// Today's scheduled workout type based on day of week
export function todaysWorkout(schedule) {
  const today = new Date().getDay() // 0=Sun
  const slot = schedule.find((s) => s.dow === today)
  return slot ? WORKOUT_TYPES[slot.type] || WORKOUT_TYPES.rest : WORKOUT_TYPES.rest
}
