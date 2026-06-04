// VOLT icon set — exact geometry from the design prototype.
export function Icon({ name, size = 22, stroke = 1.7, className, style }) {
  const p = ICONS[name] || ICONS.dot
  return (
    <svg className={className} style={style} width={size} height={size}
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {p}
    </svg>
  )
}

const ICONS = {
  home:     <><path d="M3 11l9-7 9 7" /><path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" /></>,
  train:    <><path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12" /></>,
  goals:    <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M10 9l5 3-5 3z" /></>,
  history:  <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  vitals:   <path d="M3 12h4l2 5 4-12 2 7h6" />,
  more:     <><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></>,
  flame:    <path d="M12 3c1 3-2 4-2 7a2 2 0 0 0 4 0c2 2 3 4 3 6a5 5 0 0 1-10 0c0-4 4-6 5-13z" />,
  bolt:     <path d="M13 2 4 14h6l-1 8 9-12h-6z" />,
  plus:     <><path d="M12 5v14M5 12h14" /></>,
  chevron:  <path d="M9 6l6 6-6 6" />,
  back:     <path d="M15 6l-6 6 6 6" />,
  check:    <path d="M5 12l5 5 9-11" />,
  play:     <path d="M7 5v14l12-7z" />,
  bookmark: <path d="M6 4h12v16l-6-4-6 4z" />,
  clock:    <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  drop:     <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />,
  run:      <><circle cx="14" cy="5" r="2" /><path d="M5 20l3-5 3 1 1 4M11 16l-2-5 4-2 2 3 3 1" /></>,
  shield:   <path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6z" />,
  trend:    <><path d="M3 17l6-6 4 4 8-8" /><path d="M21 7v5h-5" /></>,
  link:     <><path d="M9 15l6-6" /><path d="M11 6l1-1a4 4 0 0 1 6 6l-1 1M13 18l-1 1a4 4 0 0 1-6-6l1-1" /></>,
  sun:      <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></>,
  camera:   <><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="12" cy="12.5" r="3.5" /></>,
  image:    <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="M21 16l-5-5L5 20" /></>,
  pencil:   <><path d="M4 20h4l10-10-4-4L4 16z" /><path d="M14 6l4 4" /></>,
  send:     <path d="M5 12l15-7-7 15-2-6z" />,
  spark:    <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z" />,
  x:        <path d="M6 6l12 12M18 6L6 18" />,
  moon:     <path d="M20 14a8 8 0 1 1-9.5-9.8A6 6 0 0 0 20 14z" />,
  heart:    <path d="M12 20s-7-4.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.7-7 9-7 9z" />,
  dot:      <circle cx="12" cy="12" r="3" />,
}
