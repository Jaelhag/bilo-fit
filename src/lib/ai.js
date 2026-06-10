// =============================================================================
//  AI PARSING via Google Gemini (optional upgrade over the local parser)
//  Calls Gemini directly from the browser with the user's own free API key.
//  Multimodal: can read text OR images (screenshots / photos of notes).
//
//  Key is stored on-device (localStorage). It's a free Gemini-only key — low
//  blast radius — and can be restricted to this site in Google Cloud.
// =============================================================================

const KEY_LS = 'mc-gemini-key'
const MODEL  = 'gemini-2.0-flash'

export const getAiKey = () => localStorage.getItem(KEY_LS) || ''
export const setAiKey = (k) => { const v = (k || '').trim(); if (v) localStorage.setItem(KEY_LS, v); else localStorage.removeItem(KEY_LS) }
export const hasAi    = () => !!localStorage.getItem(KEY_LS)

const PROMPT = `You convert an athlete's workout notes into JSON for a fitness log. Return ONLY raw JSON, no markdown, no commentary.
Shape:
{"sessionType":"upper-lift|lower-lift|explosive|echo-bike|zone2|mobility","title":"short session title","exercises":[{"name":"Exercise","sets":[{"weight":"","reps":""}],"note":""}],"zone2Min":0,"note":""}
Rules:
- A set written like "150x10" or "150 x 10" means weight 150, reps 10. Expand comma-separated sets ("50x10, 90x10") into multiple set objects.
- Bodyweight moves (chins, dips, push-ups) → weight "" and reps as the number done.
- Cardio lines (treadmill, elliptical, walk, bike) with minutes → add the minutes into zone2Min (sum them) and keep the original line in "note".
- Warm-up / mobility movements with no numbers → include as exercises with empty sets[] OR summarize in "note".
- Keep coaching cues / rest-pause / failure annotations in each exercise's "note".
- Choose the most accurate sessionType. If the user explicitly tells you the type, use it.`

// images: [{ mime, data(base64) }]
export async function aiParse(key, { text, images, typeHint }) {
  const parts = []
  let instruction = PROMPT
  if (typeHint) instruction += `\n\nThe athlete says this is a "${typeHint}" session — use that as sessionType.`
  if (text) instruction += `\n\nNotes:\n"""\n${text}\n"""`
  else instruction += `\n\nRead the workout directly from the attached image(s).`
  parts.push({ text: instruction })
  ;(images || []).forEach((img) => parts.push({ inline_data: { mime_type: img.mime, data: img.data } }))

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
    }),
  })
  if (!res.ok) {
    let body = ''
    try { body = await res.text() } catch {}
    throw new Error(friendlyErr(res.status, body))
  }
  const data = await res.json()
  const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const m = txt.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('The AI returned an unexpected response — try again.')
  const obj = JSON.parse(m[0])
  return normalize(obj)
}

function normalize(o) {
  return {
    sessionType: o.sessionType || 'upper-lift',
    title: o.title || 'Workout',
    exercises: (o.exercises || []).map((e) => ({
      name: e.name || '',
      sets: (e.sets || []).map((s) => ({ weight: s.weight == null ? '' : String(s.weight), reps: s.reps == null ? '' : String(s.reps) })),
      note: e.note || '',
    })),
    zone2Min: o.zone2Min ? String(o.zone2Min) : '',
    note: o.note || '',
  }
}

function friendlyErr(status, body) {
  if (status === 400 && /API key not valid|API_KEY_INVALID/i.test(body)) return 'That Gemini key was rejected — double-check you copied it fully.'
  if (status === 403) return 'Gemini refused the request (key not enabled or restricted). Check the key in Google AI Studio.'
  if (status === 429) return 'Gemini is rate-limited right now — wait a moment and try again.'
  if (status === 404) return 'AI model unavailable — let Jordan know so it can be updated.'
  return `AI error (${status}). Try again, or use the on-device reader.`
}

// Read a File into Gemini's inline image format.
export function fileToInline(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve({ mime: file.type || 'image/png', data: String(r.result).split(',')[1] })
    r.onerror = () => reject(new Error('Could not read the image file.'))
    r.readAsDataURL(file)
  })
}
