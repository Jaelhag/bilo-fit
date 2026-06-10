// =============================================================================
//  LOCAL WORKOUT-NOTES PARSER  (no AI / no backend — runs fully offline)
//  Turns free-text training notes into structured data, and guesses the
//  session type (the user can always override it).
// =============================================================================

const CARDIO = /(elliptical|eliptical|treadmill|walk|jog|run\b|biking|bike|row(?:ing)?\s*machine|zone\s?2|cardio|stairmaster|incline)/i

// Guess a session type from the text. The UI lets the user override this.
export function guessType(text) {
  const t = (text || '').toLowerCase()
  const count = (re) => (t.match(re) || []).length

  const echo = /echo\s?bike|4\s?[x×]\s?4|norwegian|intervals? (on|off)/.test(t)
  if (echo) return 'echo-bike'

  const mobility = count(/tailor|pancake|side split|front split|\bpike\b|bridge|straddle|pails|rails|adductor|jefferson curl|good morning/g)
  const lift = count(/bench|pulldown|pull[- ]?up|\bchin|\brow\b|\bdip\b|incline|dbell|dumbbell|barbell|cable|press|\bfly\b|\bcurl\b|extension|raise|squat|deadlift|\brdl\b|lunge|hip thrust|calf|leg press|leg curl/g)
  const explosive = count(/hill sprint|\bsprint|\bstride|\bpogo|\bbound|broad jump|box jump|depth jump|\bplyo|sled/g)

  if (mobility >= 2 && mobility > lift) return 'mobility'
  if (lift >= explosive && lift > 0) {
    const upper = count(/bench|pulldown|pull|chin|\brow\b|\bdip\b|incline|press|\bfly\b|lat|tricep|bicep|\bcurl\b|shoulder|ohp/g)
    const lower = count(/squat|deadlift|\brdl\b|lunge|\bleg\b|calf|glute|hamstring|quad|hip thrust|bulgarian/g)
    return upper >= lower ? 'upper-lift' : 'lower-lift'
  }
  if (explosive > 0) return 'explosive'
  if (CARDIO.test(t)) return 'zone2'
  return 'upper-lift'
}

const TITLES = {
  'upper-lift': 'Upper Body', 'lower-lift': 'Lower Body',
  explosive: 'Explosive Day', 'echo-bike': 'Echo Bike',
  zone2: 'Zone 2', mobility: 'Mobility',
}

const SECTION = /^(back|chest|legs?|shoulders?|arms?|pull|push|biceps?|triceps?|core|abs|warm[\s-]*up|activation|mobility|conditioning)\b[:\-–]?\s*$/i

export function parseWorkout(text, type) {
  const lines = (text || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  const exercises = []
  const notes = []
  let zone2 = 0
  let dateGuess = null

  for (const raw of lines) {
    // Standalone date line ("June 10, 2026")
    if (/^[A-Za-z]+\.?\s+\d{1,2},?\s+\d{4}$/.test(raw)) { dateGuess = raw; continue }
    // Section header → skip (just organizes the notes)
    if (SECTION.test(raw)) continue
    // Cardio / time-based line
    const timeM = raw.match(/(\d+)\s*min/i)
    if (CARDIO.test(raw) && timeM) {
      notes.push(raw)
      if (/walk|treadmill|elliptical|eliptical|zone\s?2/i.test(raw)) zone2 += parseInt(timeM[1], 10)
      continue
    }
    const ex = parseExerciseLine(raw)
    if (ex) exercises.push(ex)
    else notes.push(raw)
  }

  return {
    sessionType: type,
    title: TITLES[type] || 'Workout',
    exercises,
    zone2Min: zone2 || '',
    note: notes.join(' · '),
    dateGuess,
  }
}

function parseExerciseLine(line) {
  const setRe = /(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+)/g
  const sets = []
  let m
  while ((m = setRe.exec(line))) sets.push({ weight: m[1], reps: m[2] })

  // Determine the exercise name (text before the data starts)
  let name = line
  const colon = line.indexOf(':')
  if (colon > 0) {
    name = line.slice(0, colon)
  } else {
    const sep = line.match(/\s[–-]\s|[–-](?=\s*\d)/)   // " - "  or  "-5"
    if (sep) name = line.slice(0, sep.index)
    else { const d = line.search(/\d/); if (d > 0) name = line.slice(0, d) }
  }
  name = name.replace(/[:\-–]\s*$/, '').trim()
  if (!name) return null

  // Whatever follows the name → strip the WxR sets to leave a note
  let rest = line.slice(name.length).replace(/^[:\-–\s]+/, '')
  let note = rest.replace(setRe, '').replace(/\s{2,}/g, ' ').trim().replace(/^[,\-–\s]+|[,\-–\s]+$/g, '')

  // Bodyweight pattern with just a leading rep count ("Chins - 3 rp")
  if (!sets.length) {
    const nm = rest.match(/^(\d+)\s*(.*)$/)
    if (nm) { sets.push({ weight: '', reps: nm[1] }); note = nm[2].trim() }
  }

  return { name, sets, note }
}

export const SESSION_TYPES = [
  { id: 'upper-lift', label: 'Upper Lift', emoji: '💪' },
  { id: 'lower-lift', label: 'Lower Lift', emoji: '🦵' },
  { id: 'explosive',  label: 'Explosive', emoji: '⚡' },
  { id: 'echo-bike',  label: 'Echo Bike', emoji: '🚴' },
  { id: 'zone2',      label: 'Zone 2',    emoji: '🚶' },
  { id: 'mobility',   label: 'Mobility',  emoji: '🤸' },
]
