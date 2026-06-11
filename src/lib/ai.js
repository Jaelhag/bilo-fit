// =============================================================================
//  AI PARSING — Google Gemini OR Anthropic Claude (user's own key)
//  Calls the provider directly from the browser. Multimodal: reads text OR
//  images (screenshots / photos of notes). Key stored on-device only.
// =============================================================================

const PROV_LS = 'mc-ai-provider'
const keyLS = (p) => `mc-ai-key-${p}`

const GEMINI_MODEL    = 'gemini-2.0-flash'
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001'

export const PROVIDERS = [
  { id: 'gemini',    label: 'Google Gemini', keyUrl: 'https://aistudio.google.com/apikey',          note: 'Free tier. Uses your Google account.' },
  { id: 'anthropic', label: 'Anthropic Claude', keyUrl: 'https://console.anthropic.com/settings/keys', note: 'Your paid Claude key (a few hundredths of a cent per parse).' },
]

export const getProvider = () => localStorage.getItem(PROV_LS) || 'gemini'
export const setProvider = (p) => localStorage.setItem(PROV_LS, p)
export const getAiKey = (p = getProvider()) => localStorage.getItem(keyLS(p)) || ''
export const setAiKey = (p, k) => { const v = (k || '').trim(); if (v) localStorage.setItem(keyLS(p), v); else localStorage.removeItem(keyLS(p)) }
export const hasAi = () => !!getAiKey(getProvider())

const PROMPT = `You convert an athlete's workout notes into JSON for a fitness log. Return ONLY raw JSON, no markdown, no commentary.
Shape:
{"sessionType":"upper-lift|lower-lift|explosive|echo-bike|zone2|mobility","title":"short session title","exercises":[{"name":"Exercise","sets":[{"weight":"","reps":""}],"note":""}],"zone2Min":0,"note":""}
Rules:
- A set like "150x10" / "150 x 10" means weight 150, reps 10. Expand comma-separated sets ("50x10, 90x10") into multiple set objects.
- Bodyweight moves (chins, dips, push-ups) → weight "" and reps as the number done.
- Cardio lines (treadmill, elliptical, walk, bike) with minutes → sum the minutes into zone2Min and keep the original line in "note".
- Warm-up / mobility movements with no numbers → include as exercises with empty sets[] OR summarize in "note".
- Keep cues / rest-pause / failure annotations in each exercise's "note".
- Pick the most accurate sessionType. If the user names the type, use it.`

function buildInstruction({ text, images, typeHint }) {
  let s = PROMPT
  if (typeHint) s += `\n\nThe athlete says this is a "${typeHint}" session — use that as sessionType.`
  s += text ? `\n\nNotes:\n"""\n${text}\n"""` : `\n\nRead the workout directly from the attached image(s).`
  return s
}

export async function aiParse(opts) {
  const provider = getProvider()
  const key = getAiKey(provider)
  if (!key) throw new Error('No AI key set — add one in More → AI parsing.')
  return provider === 'anthropic' ? anthropicParse(key, opts) : geminiParse(key, opts)
}

// ---- Gemini ----
async function geminiParse(key, opts) {
  const parts = [{ text: buildInstruction(opts) }]
  ;(opts.images || []).forEach((img) => parts.push({ inline_data: { mime_type: img.mime, data: img.data } }))
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`
  const res = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseMimeType: 'application/json', temperature: 0.1 } }),
  })
  if (!res.ok) throw new Error(errMsg('gemini', res.status, await safeText(res)))
  const data = await res.json()
  return extract(data?.candidates?.[0]?.content?.parts?.[0]?.text || '')
}

// ---- Anthropic (direct browser access) ----
async function anthropicParse(key, opts) {
  const content = []
  ;(opts.images || []).forEach((img) => content.push({ type: 'image', source: { type: 'base64', media_type: img.mime, data: img.data } }))
  content.push({ type: 'text', text: buildInstruction(opts) })
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 2000, messages: [{ role: 'user', content }] }),
  })
  if (!res.ok) throw new Error(errMsg('anthropic', res.status, await safeText(res)))
  const data = await res.json()
  const txt = (data?.content || []).map((c) => c.text || '').join('')
  return extract(txt)
}

function extract(txt) {
  const m = txt.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('The AI returned an unexpected response — try again.')
  return normalize(JSON.parse(m[0]))
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

async function safeText(res) { try { return await res.text() } catch { return '' } }

function errMsg(provider, status, body) {
  if (status === 401 || (status === 400 && /API key not valid|API_KEY_INVALID|invalid x-api-key|authentication/i.test(body)))
    return `That ${provider === 'anthropic' ? 'Claude' : 'Gemini'} key was rejected — double-check it.`
  if (status === 403) return 'The key was refused (not enabled or restricted). Check it in the provider console.'
  if (status === 429) return 'Rate-limited right now — wait a moment and try again.'
  if (status === 404) return 'AI model unavailable — let Jordan know so it can be updated.'
  return `AI error (${status}). Try again, or switch off AI to use the on-device reader.`
}

// Read a File into the providers' inline image format.
export function fileToInline(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve({ mime: file.type || 'image/png', data: String(r.result).split(',')[1] })
    r.onerror = () => reject(new Error('Could not read the image file.'))
    r.readAsDataURL(file)
  })
}
