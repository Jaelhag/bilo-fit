// =============================================================================
//  THE COACHING ENGINE
//  - generateProgram(): turns assessment answers into an ordered Phase-1 program
//    (A1, B1, B2, C1 ...) using the course's real decision tree.
//  - suggestProgression(): looks at your last log for a drill and proposes the
//    next target, in the course's order: RANGE first, then LOAD, then SETS.
//  - nextDue(): recovery-based "train again in N days".
// =============================================================================

import { drill, DRILLS, TYPE_DEFAULTS } from '../data/library.js'

// ---- Program generation ------------------------------------------------------

// Side Split — the verified tree. Returns an ordered list of drill ids with
// their programming slot (A/B/C). Items in the same letter are supersetted.
function sideSplitProgram(a) {
  const items = [] // { drillId, swap? }
  let letter = 0 // 0=A, 1=B, 2=C ...
  const push = (drillId) => items.push({ drillId })

  // Block 1 — technique (only if you can't yet hold the position)
  const needsTechnique = a.position !== 'yes'
  if (needsTechnique) {
    push('horse-stance-slides') // A1
    letter = 1 // loaded stretches drop to B
  }

  // Block 2 — loaded stretches, chosen by the Tailor's-Pose calf check
  if (a.tailorsCalves === 'yes') {
    push('horse-stance-squats')
    push('straight-leg-get-ups')
  } else {
    push('tailors-pose')
    push('horse-stance-squats')
  }

  // Block 3 — the range-winning drill (its letter depends on the path above)
  let finisher
  if (a.pancakeHead === 'yes') {
    if (a.heldTime !== 'yes') finisher = 'isometric-side-split'
    else finisher = a.handsDiff === 'yes' ? 'side-split-contract-relax' : 'kneeling-tilt-closed-hip'
  } else {
    // More limited folks build the hang; deeper folks load it. The course's
    // printed beginner example lands on the Standing Pancake Hang.
    finisher = a.pancakeDepth === 'deep' ? 'pancake-good-morning' : 'standing-pancake-hang'
  }
  push(finisher)

  // Left/right imbalance → swap bilateral drills for their unilateral version.
  if (a.imbalance === 'yes') {
    items.forEach((it) => {
      if (it.drillId === 'horse-stance-squats') it.swap = 'drop-stance-squats'
    })
  }

  return labelOrder(items)
}

// Pancake — verified tree from the Phase 1 Program Builder PDF.
// Uses explicit slots so the optional warm-up (A1/A2) doesn't confuse labelOrder.
function pancakeProgram(a) {
  const slotted = [] // { drillId, slot }

  // A block — optional warm-up (course says recommended, phase out if no benefit)
  slotted.push({ drillId: 'pc-rolling-feet',  slot: 'A1' })
  slotted.push({ drillId: 'pc-calf-stretch',  slot: 'A2' })

  // B block — main loaded stretch, chosen by Tailor's Pose calf check
  const b1 = a.pcCalves === 'yes' ? 'pc-standing-pike-gm' : 'pc-tailors-pose'
  slotted.push({ drillId: b1, slot: 'B1' })

  // C block — depth-specific drill
  let c1
  if (a.pcDepth === 'over90')  c1 = 'pc-straddle-jcurl'
  else if (a.pcDepth === 'under90') c1 = 'pc-roundback-gm'
  else if (a.pcDepth === 'head')    c1 = 'pc-straight-arm-lifts'
  else                               c1 = 'pc-over-straight-arm-lifts' // chest to floor
  slotted.push({ drillId: c1, slot: 'C1' })

  // D block — finisher
  let d1
  if (a.pcDepth === 'head' || a.pcDepth === 'chest') {
    d1 = 'pc-pancake-lifts'   // floor paths → Pancake Lifts directly
  } else {
    d1 = a.pcLiftDiff === 'yes' ? 'pc-pancake-lifts' : 'pc-standing-pancake-hang'
  }
  slotted.push({ drillId: d1, slot: 'D1' })

  return slotted  // already has slot; generateProgram will map to drill objects
}

// Beginner-default template for goals whose exact tree isn't pulled yet:
// one of each useful type, ordered technique → loaded → contract/iso → active.
function defaultProgram(goalId, a) {
  const lib = DRILLS[goalId] || []
  const order = ['technique', 'loaded-stretch', 'loaded-stretch', 'contract-relax', 'isometric', 'active']
  const used = new Set()
  const items = []
  for (const type of order) {
    const d = lib.find((x) => x.type === type && !used.has(x.id))
    if (d) { used.add(d.id); items.push({ drillId: d.id }) }
    if (items.length >= 4) break
  }
  return labelOrder(items)
}

export function generateProgram(goalId, answers = {}) {
  const items =
    goalId === 'side-split' ? sideSplitProgram(answers) :
    goalId === 'pancake'    ? pancakeProgram(answers) :
    defaultProgram(goalId, answers)
  return items.map((it) => {
    const base = drill(goalId, it.swap || it.drillId)
    return {
      slot: it.slot,
      drillId: base.id,
      name: base.name,
      type: base.type,
      video: base.video,
      cue: base.cue,
      params: { ...base.params },
      swappedFor: it.swap ? it.drillId : null,
      draft: !!base.draft,
    }
  })
}

// Assign A1/A2/B1... labels. Consecutive same-letter blocks number within letter.
function labelOrder(items) {
  // Group: technique = A, loaded stretches = B, finisher = C (for side split).
  // Generic approach: walk types and bump the letter when the "tier" changes.
  const tier = (id) => {
    const t = lookupType(id)
    if (t === 'technique') return 0
    if (t === 'loaded-stretch' || t === 'active') return 1
    return 2 // contract-relax, isometric
  }
  let curTier = null
  let letterIdx = -1
  let n = 0
  const LETTERS = 'ABCDEF'
  return items.map((it) => {
    const tr = tier(it.swap || it.drillId)
    if (tr !== curTier) { curTier = tr; letterIdx++; n = 0 }
    n++
    return { ...it, slot: `${LETTERS[letterIdx]}${n}` }
  })
}

function lookupType(drillId) {
  for (const goal of Object.keys(DRILLS)) {
    const d = DRILLS[goal].find((x) => x.id === drillId)
    if (d) return d.type
  }
  return 'loaded-stretch'
}

// ---- Progression suggestions (range → load → sets) --------------------------

// `lastLog` = { rpe, soreDays, depthNote, load, setsDone, maxRange } | undefined
export function suggestProgression(goalId, drillId, lastLog) {
  const d = drill(goalId, drillId)
  if (!d) return null
  const type = d.type
  if (!lastLog) {
    return { headline: 'First time — just learn the movement', detail: `Use the starting numbers: ${fmt(d.params)}. Watch the form video once.`, lever: 'baseline' }
  }
  const easy = lastLog.rpe != null && lastLog.rpe <= 6
  const hard = lastLog.rpe != null && lastLog.rpe >= 9
  const sore = lastLog.soreDays != null && lastLog.soreDays >= 4

  if (hard || sore) {
    return { headline: 'Hold here / repeat', detail: sore ? 'You were sore 4+ days last time — repeat the same numbers and let recovery catch up.' : 'That was near-max effort — repeat the same numbers and clean up the reps before adding anything.', lever: 'hold' }
  }
  if (!easy) {
    return { headline: 'Repeat & deepen slightly', detail: 'Same numbers, but aim for a touch more range on each rep.', lever: 'range' }
  }
  // It felt easy → progress in the course's order.
  if (lastLog.maxRange !== true) {
    return { headline: 'Add RANGE first', detail: 'Go a little deeper / wider before anything else. Only add load once range stalls.', lever: 'range' }
  }
  if (loadable(type)) {
    return { headline: 'Add a little LOAD', detail: 'Range has stalled — add a small amount of weight while keeping full range.', lever: 'load' }
  }
  const sets = parseInt(lastLog.setsDone, 10)
  if (sets && sets < 4 && hasSetRoom(d)) {
    return { headline: 'Add a SET', detail: `Go from ${sets} to ${sets + 1} sets.`, lever: 'sets' }
  }
  return { headline: 'Solid — hold and keep deepening', detail: 'You are at the top of Phase 1 numbers for this drill. Keep winning range; we will move you to Phase 2 soon.', lever: 'phase' }
}

const loadable = (type) => type === 'loaded-stretch'
const hasSetRoom = (d) => String(d.params.sets).includes('-') || parseInt(d.params.sets, 10) < 4
const fmt = (p) => `${p.reps} reps · ${p.sets} sets · tempo ${p.tempo} · rest ${p.rest}`

// ---- Recovery-based scheduling ----------------------------------------------

// soreDays from the last session → days until the next, per the course chart.
export function nextDue(lastSession, weeklyTarget = 1) {
  if (!lastSession) return null
  const sore = lastSession.soreDays
  let gap
  if (sore == null) gap = Math.round(7 / weeklyTarget)
  else if (sore >= 4) gap = 6 // poor recovery
  else if (sore >= 2) gap = 4 // average recovery
  else gap = 3 // superior recovery
  // Never schedule tighter than the user's chosen weekly cadence implies.
  gap = Math.max(gap, Math.floor(7 / weeklyTarget))
  const due = new Date(lastSession.date)
  due.setDate(due.getDate() + gap)
  return { gap, due }
}

export const FMT_PARAMS = fmt
