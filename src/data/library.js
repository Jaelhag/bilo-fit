// =============================================================================
//  THE COURSE DATABASE
//  Structured knowledge extracted from Matthew Smith's Mobility & Flexibility
//  Toolkit. The app reasons over this; the course remains the source for the
//  form/video of each drill (see `video` links).
//
//  Drill `type` drives the default training parameters (the course uses a
//  consistent scheme across every goal):
//    technique       — groove the position. Cluster reps, light, not hard.
//    loaded-stretch  — weighted end-range strength. The main driver.
//    contract-relax  — tense / release cycles to win new range.
//    isometric       — long max holds at end range.
//    active          — own the new range actively (often unilateral).
//
//  TEMPO is 4 phases in seconds: [ lower-in, pause-deep, come-up, pause-top ].
//  A dash means that phase is skipped / unloaded.
// =============================================================================

export const COURSE_BASE = 'https://www.matthewismith.com/products/mobility-flexibility-toolkit'

// Default parameters per drill type — the toolkit's standard starting points.
export const TYPE_DEFAULTS = {
  technique:      { reps: '10 cluster', sets: '1',   tempo: '5-1-0', rest: '60s',    load: 'bodyweight' },
  'loaded-stretch': { reps: '8',        sets: '3-4', tempo: '2-3-1-0', rest: '60-90s', load: '5-10kg' },
  'contract-relax': { reps: '6 cycles', sets: '2-3', tempo: '5s pull / 5s relax', rest: '90s', load: 'bodyweight' },
  isometric:      { reps: '40-60s hold', sets: '2-3', tempo: 'hold',  rest: '60-90s', load: 'bodyweight' },
  active:         { reps: '6',          sets: '2-3', tempo: '2-0-1-3', rest: '60-90s', load: 'bodyweight' },
}

export const TYPE_LABELS = {
  technique: 'Technique',
  'loaded-stretch': 'Loaded stretch',
  'contract-relax': 'Contract–relax',
  isometric: 'Isometric',
  active: 'Active',
}

// The six flexibility goals.
export const GOALS = [
  { id: 'side-split',  name: 'Side Split',  emoji: '🦵', blurb: 'Middle splits.', status: 'full' },
  { id: 'pancake',     name: 'Pancake',     emoji: '🥞', blurb: 'Seated straddle, chest to floor.', status: 'full' },
  { id: 'front-split', name: 'Front Split', emoji: '🤸', blurb: 'Front-to-back splits (each leg).', status: 'draft' },
  { id: 'pike',        name: 'Pike / Toe-Touch', emoji: '🙇', blurb: 'Forward fold, touch your toes.', status: 'draft' },
  { id: 'shoulder',    name: 'Shoulder',    emoji: '💪', blurb: 'Overhead reach & rotation.', status: 'draft' },
  { id: 'bridge',      name: 'Bridge',      emoji: '🌉', blurb: 'Backbend.', status: 'draft' },
]

const P = (cat) => `${COURSE_BASE}/categories/${cat}`

// -----------------------------------------------------------------------------
//  DRILL LIBRARY
//  Side Split is fully seeded (exact params + form-video links, verified from
//  the course). The other goals are seeded with their real drill names + types
//  and use the standard type defaults until each goal's exact selection logic
//  is pulled from the course. `draft: true` flags the not-yet-verified ones.
// -----------------------------------------------------------------------------
export const DRILLS = {
  'side-split': [
    {
      id: 'horse-stance-slides', name: 'Horse Stance Slides', type: 'technique',
      video: P('2371714/posts/7877763'),
      params: { reps: '10 cluster', sets: '1', tempo: '5-1-0', rest: '60s', load: 'bodyweight' },
      repsKind: 'cluster',
      cue: 'On sliders: 5s to slide out toward the split, 1s pause at your limit, then push back up with your hands. Rest 10s between each cluster rep. Goal is grooving the shape (hips behind ankles, arched back, tall chest) — not effort.',
    },
    {
      id: 'tailors-pose', name: "Tailor's Pose", type: 'loaded-stretch',
      video: P('2371714/posts/7877766'),
      params: { reps: '8', sets: '3-4', tempo: '2-3-1-0', rest: '60-90s', load: '5-10kg / side' },
      cue: 'Seated butterfly, soles together. Weight on the inner thigh/knee. 2s press down, 3s pause deep, 1s ease up. Chase depth, not weight.',
    },
    {
      id: 'horse-stance-squats', name: 'Horse Stance Squats', type: 'loaded-stretch',
      video: P('2371714/posts/7877767'),
      params: { reps: '8', sets: '3-4', tempo: '2-3-1-0', rest: '60-90s', load: 'bodyweight → DB' },
      cue: 'Wide horse stance, toes out, squat straight down between the legs. Experiment with stance width (wider = harder). Add a dumbbell at the chest once bodyweight is easy.',
    },
    {
      id: 'drop-stance-squats', name: 'Drop Stance Squats', type: 'loaded-stretch',
      video: P('2371714/posts/10639260'), unilateral: true,
      params: { reps: '8 / side', sets: '2-3', tempo: '2-3-1-0', rest: '45s', load: 'bodyweight first' },
      cue: 'One side at a time. Weaker (less flexible) side first, rest 15s, match the reps on the stronger side — both sides = one set. Start with no added weight, chase range.',
    },
    {
      id: 'straight-leg-get-ups', name: 'Straight Leg Get-Ups (hands-free)', type: 'active',
      video: P('2371714/posts/7877788'),
      params: { reps: '6 + 10s hold on last rep', sets: '3-4', tempo: '2-0-1-3', rest: '60-90s', load: 'bodyweight' },
      cue: '6 reps, hold the last rep for 10s. 2s down, no pause, 1s up, 3s pause at top.',
    },
    {
      id: 'pancake-good-morning', name: 'Pancake Good Morning', type: 'loaded-stretch',
      video: P('2371714/posts/2194899293'),
      params: { reps: '6', sets: '3-4', tempo: '3-2-2-0', rest: '60-90s', load: '5-10kg' },
      cue: 'Pick a weight that pulls you DEEPER, not so heavy you lose range. 3s down, 2s pause deep, 2s up, no pause at top. Intense tempo — don’t rest in the top.',
    },
    {
      id: 'standing-pancake-hang', name: 'Standing Pancake Hang', type: 'contract-relax',
      video: P('2371714/posts/10639199'),
      params: { reps: '6 cycles', sets: '2-3', tempo: '5s pull / 5s relax', rest: '90s', load: 'bodyweight' },
      cue: 'Wide straddle stand, fold and hang. One set = 6 cycles of: 5s gently pulling deeper with the hip flexors, 5s relaxing into the hang. Come up SLOWLY (head-rush). Rest between sets standing, not in the hang.',
    },
    {
      id: 'isometric-side-split', name: 'Isometric Side Split', type: 'isometric',
      video: P('2371714/posts/7877792'),
      params: { reps: '40-60s hold', sets: '2-3', tempo: 'hold', rest: '60-90s', load: 'bodyweight' },
      cue: 'Set a width you can just hold for ~40s — it should feel like a max hold. Progress width first, then hold time.',
    },
    {
      id: 'side-split-contract-relax', name: 'Side Split Contract–Relax', type: 'contract-relax',
      video: P('2371714/posts/8826693'),
      params: { reps: '3', sets: '2-3', tempo: '5s/5s agonist + 5s/5s antagonist', rest: '90s', load: 'bodyweight' },
      cue: 'Each rep = two rounds: (1) drive heels into the floor 5s, relax deeper 5s; (2) try to lift the feet 5s, rest 5s. Sink a little further every relax.',
    },
    {
      id: 'kneeling-tilt-closed-hip', name: 'Kneeling Tilt (closed hip)', type: 'active',
      video: P('2371714/posts/10800160'), unilateral: true,
      params: { reps: '5 / side', sets: '2-3', tempo: '1-1-1-3', rest: '60s', load: 'bodyweight' },
      cue: 'One side at a time, weaker side first then match. 1s down, 1s rest the leg, 1s up, 3s hold at top.',
    },
  ],

  // ---- Draft goals: real drill names + types; standard type-default params. ----
  'front-split': draft('front-split', [
    ['isometric-front-split', 'Isometric Front Split', 'isometric', '2150479520/posts/2159008298'],
    ['front-split-slides', 'Front Split Slides', 'technique', '2150479520/posts/2159045100'],
    ['couch-stretch-low', 'Couch Stretch — Hips Low', 'loaded-stretch', '2150479520/posts/2162104346'],
    ['couch-stretch-high', 'Couch Stretch — Hips High', 'loaded-stretch', '2150479520/posts/2159045111'],
    ['blocked-hip-extension', 'Blocked Hip Extension', 'loaded-stretch', '2150479520/posts/2160948382'],
    ['kneeling-needle', 'Kneeling Needle', 'loaded-stretch', '2150479520/posts/2169549760'],
    ['reverse-nordic', 'Reverse Nordic Curls', 'active', '2150479520/posts/2160948416'],
    ['jefferson-curl-fs', 'Jefferson Curl', 'loaded-stretch', '2150479520/posts/2158405375'],
    ['standing-pike-gm-fs', 'Standing Pike Good Morning', 'loaded-stretch', '2150479520/posts/2158405383'],
    ['split-squats', 'Split Squats', 'loaded-stretch', '2150479520/posts/2168445599'],
    ['rec-fem-pin-stretch', 'Rec Fem Pin & Stretch', 'loaded-stretch', '2150479520/posts/2173699602'],
  ]),

  'pancake': [
    // ---- Optional warm-up block (A) ----
    {
      id: 'pc-rolling-feet', name: 'Rolling Out the Feet', type: 'technique',
      video: P('2975050/posts/11389536'),
      params: { reps: 'by feel', sets: '1', tempo: 'slow pressure', rest: '0s', load: 'lacrosse/massage ball' },
      cue: 'Roll the sole of each foot one at a time. Focus pressure on tight or tender spots. No set time — go until you feel a change.',
    },
    {
      id: 'pc-calf-stretch', name: 'Single Leg Calf Stretch', type: 'isometric',
      video: P('2975050/posts/14307055'),
      params: { reps: '60s / position', sets: '1', tempo: 'hold', rest: '0s', load: 'bodyweight' },
      cue: 'Three positions per leg: foot straight forward 60s, foot turned out 60s, foot turned in 60s. Straight knee then bent knee for each. Optional — phase out if no benefit.',
    },
    // ---- B: main loaded stretch ----
    {
      id: 'pc-tailors-pose', name: "Tailor's Pose", type: 'loaded-stretch',
      video: P('2975050/posts/11389755'),
      params: { reps: '8', sets: '3-4', tempo: '2-3-1-0', rest: '60s', load: '5-10kg / side' },
      cue: 'Seated butterfly, soles together. Weight on inner thigh/knee. 2s press knees down, 3s pause deep, 1s ease up. Start 5-10kg per side. Chase depth, not weight.',
    },
    {
      id: 'pc-standing-pike-gm', name: 'Standing Pike Good Morning', type: 'loaded-stretch',
      video: P('2975050/posts/12492990'),
      params: { reps: '8', sets: '3-4', tempo: '2-3-1-0', rest: '60-90s', load: '5-10kg' },
      cue: 'Wide stance, weight behind neck or hugged to chest. 2s lower the chest toward the floor, 3s pause deep, 1s lift back up. Keep legs straight.',
    },
    // ---- C: depth-specific drill ----
    {
      id: 'pc-straddle-jcurl', name: 'Straddle Jefferson Curl', type: 'loaded-stretch',
      video: P('2975050/posts/9913372'),
      params: { reps: '5', sets: '3-4', tempo: '6-2-4-0', rest: '90s', load: '5-10kg' },
      cue: 'Wide straddle stand on a block/plate, weight hanging. 6s to curl down vertebra by vertebra, 2s pause at the bottom, 4s to uncurl back up. Use a weight that pulls you deeper. Start 5-10kg.',
    },
    {
      id: 'pc-roundback-gm', name: 'Pancake Good Morning (Round Back)', type: 'loaded-stretch',
      video: P('2975050/posts/9913325'),
      params: { reps: '6', sets: '3-4', tempo: '3-2-2-0', rest: '60-90s', load: '5-10kg' },
      cue: '3s to lower the chest toward floor (round the back), 2s pause deep, 2s to lift back up — do not rest at the top. Select a weight that pulls you deeper.',
    },
    {
      id: 'pc-straight-arm-lifts', name: 'Tailors Pose Straight Arm Lifts', type: 'active',
      video: P('2975050/posts/2154200787'),
      params: { reps: '6', sets: '2-3', tempo: '2-0-1-3', rest: '60-90s', load: 'bodyweight' },
      cue: 'In a pancake/straddle position, reach arms forward and lift them actively as high as possible. 2s reach forward and down, no pause, 1s lift, 3s hold at top. Own the range.',
    },
    {
      id: 'pc-over-straight-arm-lifts', name: 'Over Straight Arm Lifts', type: 'active',
      video: P('2975050/posts/9913957'),
      params: { reps: '6', sets: '2-3', tempo: '2-0-1-3', rest: '60-90s', load: 'bodyweight' },
      cue: 'From a deep pancake, reach arms overhead and lift over the body. 2s reach and lower, 1s lift over, 3s hold. A progression from straight arm lifts for those who can already get their chest near the floor.',
    },
    // ---- D: finisher ----
    {
      id: 'pc-standing-pancake-hang', name: 'Standing Pancake Hang', type: 'contract-relax',
      video: P('2975050/posts/9913300'),
      params: { reps: '6 cycles', sets: '2-3', tempo: '5s pull / 5s relax', rest: '90s', load: 'bodyweight' },
      cue: 'Wide straddle stand, fold forward and hang. 6 cycles: 5s pull deeper with hip flexors, 5s relax into the hang. Come up slowly (head-rush risk). Rest between sets standing, not hanging.',
    },
    {
      id: 'pc-pancake-lifts', name: 'Pancake Lifts', type: 'active',
      video: P('2975050/posts/12388965'),
      params: { reps: '6', sets: '2-3', tempo: '2-0-1-3', rest: '60-90s', load: 'bodyweight' },
      cue: 'In a seated pancake, actively lift one or both legs. 2s lower into the fold, no pause, 1s lift, 3s hold at top. Measures and builds active range — how high you can lift from your deepest stretch.',
    },
  ],

  'pike': draft('pike', [
    ['standing-block-crush', 'Standing Block Crush', 'technique', '4417224/posts/2184109206'],
    ['knee-ext-calf', 'Knee Extension Calf Stretch', 'loaded-stretch', '4417224/posts/2183252410'],
    ['pike-gm-standing', 'Pike Good Morning | Standing', 'loaded-stretch', '4417224/posts/14826292'],
    ['standing-pike-hang', 'Standing Pike Hang', 'contract-relax', '4417224/posts/2183248281'],
    ['jefferson-curl-pk', 'Jefferson Curl', 'loaded-stretch', '4417224/posts/2147815192'],
    ['seated-pike-lifts', 'Seated Pike & Pancake Active Lifts', 'active', '4417224/posts/2147978076'],
  ]),

  'shoulder': draft('shoulder', [
    ['lat-stretch', 'Lat Stretch | Standing & Lying', 'loaded-stretch', '2975118/posts/9913624'],
    ['pec-stretch-loaded', 'Pec Stretch | Loaded', 'loaded-stretch', '2975118/posts/2154925509'],
    ['pec-cr', 'Pec Stretch | Contract-Relax & End-Range Lift Offs', 'contract-relax', '2975118/posts/9913619'],
    ['inlocates', 'Inlocates & Dislocates', 'active', '2975118/posts/2172347706'],
    ['er-cr', 'Stretching in External Rotation | Contract-Relax', 'contract-relax', '2975118/posts/12406117'],
    ['passive-active-hang', 'Hanging | Passive & Active Hang', 'isometric', '2975128/posts/9913577'],
    ['powell-raises', 'Powell Raises', 'active', '2975227/posts/9913962'],
  ]),

  'bridge': draft('bridge', [
    ['bridge-warmup', 'Bridge General Warm Up', 'technique', '2159951865/posts/2184253564'],
    ['couch-stretch-high-br', 'Couch Stretch | Hips High', 'loaded-stretch', '2157012558/posts/2184953106'],
    ['arching-couch', 'Arching Couch Stretch', 'loaded-stretch', '2157012558/posts/2184069955'],
    ['cobra', 'Cobra Thoracic & Lumbar', 'loaded-stretch', '2157012558/posts/2184559401'],
    ['thoracic-ext', 'Leveraged Thoracic Extension', 'loaded-stretch', '2157012558/posts/2184211890'],
    ['bridge-end-range-lifts', 'Bridge End Range Lifts', 'active', '2157012558/posts/2184338520'],
    ['isometric-bridge', 'Isometric Bridge', 'isometric', '2157012558/posts/2184364103'],
  ]),
}

function draft(goal, rows) {
  return rows.map(([id, name, type, cat]) => ({
    id, name, type, video: P(cat), draft: true,
    params: { ...TYPE_DEFAULTS[type] },
    cue: '',
  }))
}

export function drill(goalId, drillId) {
  return (DRILLS[goalId] || []).find((d) => d.id === drillId)
}
