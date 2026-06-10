// VOLT chart primitives — Ring, Spark, Bars, Card, Label.
import { Icon } from './icons.jsx'

export function Ring({ value = 0, size = 76, stroke = 7, color = 'var(--accent)',
  track = 'rgba(120,150,220,.13)', label, sub, glow = true }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - Math.max(0, Math.min(1, value)))
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}
        style={{ filter: glow ? 'drop-shadow(0 0 calc(6px*var(--glow)) color-mix(in oklab, var(--accent) 70%, transparent))' : 'none' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div className="ring-c">
        {label != null && <div className="ring-v mono">{label}</div>}
        {sub && <div className="ring-s">{sub}</div>}
      </div>
    </div>
  )
}

export function Spark({ data, w = 240, h = 56, color = 'var(--accent)', fill = true, dots = false }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data), max = Math.max(...data)
  const rng = max - min || 1
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 6 - ((v - min) / rng) * (h - 12)])
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const area = `${line} L${w} ${h} L0 ${h} Z`
  const id = 'g' + Math.random().toString(36).slice(2, 7)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width="100%" height={h}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={color} stopOpacity="0.28" />
        <stop offset="1" stopColor={color} stopOpacity="0" />
      </linearGradient></defs>
      {fill && <path d={area} fill={`url(#${id})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 0 calc(3px*var(--glow)) color-mix(in oklab, var(--accent) 60%, transparent))' }} />
      {dots && pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.4" fill={color} />)}
    </svg>
  )
}

export function Bars({ data, h = 64, color = 'var(--accent)', labels }) {
  const max = Math.max(...data) || 1
  return (
    <div className="bars" style={{ height: h }}>
      {data.map((v, i) => (
        <div className="bar-col" key={i}>
          <div className="bar" style={{ height: `${(v / max) * 100}%`, background: color }} />
          {labels && <span className="bar-l mono">{labels[i]}</span>}
        </div>
      ))}
    </div>
  )
}

// Shared card + label primitives
export function Card({ children, className = '', glow = false, onClick, style }) {
  return (
    <div className={`card ${glow ? 'card-glow' : ''} ${onClick ? 'tap' : ''} ${className}`}
      onClick={onClick} style={style}>
      {children}
    </div>
  )
}

export function Label({ children, icon }) {
  return (
    <div className="lab">
      {icon && <Icon name={icon} size={13} stroke={2} />}
      <span>{children}</span>
    </div>
  )
}

// ---- Shared date helpers + picker (for backdating any log entry) ----
export function todayStr() {
  // Local YYYY-MM-DD (so "today" matches the user's calendar, not UTC)
  const d = new Date()
  const off = d.getTimezoneOffset() * 60000
  return new Date(d - off).toISOString().slice(0, 10)
}

// Turn a YYYY-MM-DD into an ISO timestamp at local noon (stable for sorting).
export function dateToISO(ymd) {
  if (!ymd) return new Date().toISOString()
  return new Date(ymd + 'T12:00:00').toISOString()
}

// A compact "when did this happen" control. Defaults to today; can't pick the future.
export function DateField({ value, onChange, label = 'When?' }) {
  const isToday = value === todayStr()
  return (
    <div>
      <label className="lbl">{label}{!isToday && <span style={{ color: 'var(--accent)' }}> · backdated</span>}</label>
      <input className="inp" type="date" value={value} max={todayStr()}
        onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
