import { useEffect, useMemo, useState } from 'react'
import { load, save } from './lib/storage.js'
import { useCloudSync } from './lib/sync.js'
import { useSheetsSync } from './lib/sheets.js'
import { GOALS } from './data/library.js'
import { Icon } from './lib/icons.jsx'
import Home from './components/Home.jsx'
import Assessment from './components/Assessment.jsx'
import Session from './components/Session.jsx'
import TrainHub from './components/TrainHub.jsx'
import Goals from './components/Goals.jsx'
import Vitals from './components/Vitals.jsx'
import More from './components/More.jsx'
import QuickLog from './components/QuickLog.jsx'

const NAV = [
  { id: 'home',   label: 'Home',   icon: 'home'   },
  { id: 'train',  label: 'Train',  icon: 'train'  },
  { id: 'vitals', label: 'Vitals', icon: 'vitals' },
  { id: 'goals',  label: 'Goals',  icon: 'goals'  },
  { id: 'more',   label: 'More',   icon: 'more'   },
]

const ACCENT_OPTIONS = ['#2f6bff', '#19b6ff', '#00e0ff', '#5b6bff', '#19e6c0']

export default function App() {
  const [state, setState] = useState(() => load())
  const [tab, setTab]     = useState('home')
  const [log, setLog]     = useState(false)
  const [accent, setAccent] = useState('#2f6bff')
  const [glow, setGlow]   = useState(1)
  const [radius, setRadius] = useState(18)
  const [density, setDensity] = useState('regular')

  useEffect(() => { save(state) }, [state])

  const update = (mutator) => setState((prev) => {
    const next = structuredClone(prev)
    mutator(next)
    return next
  })

  // Cloud sync (private GitHub gist). replaceState swaps in pulled cloud data.
  const sync = useCloudSync(state, (incoming) => setState(incoming))
  // Google Sheets sync (one-way push to the user's Bilo Fit Data sheet).
  const sheets = useSheetsSync(state)

  const activeGoal = useMemo(
    () => GOALS.find((g) => g.id === state.activeGoal) || GOALS[0],
    [state.activeGoal]
  )

  const go = (id) => {
    setTab(id)
    document.querySelector('.phone-scroll')?.scrollTo(0, 0)
  }

  const shared = { state, update, activeGoal, goTo: go }

  const rootStyle = {
    '--accent': accent,
    '--glow': glow,
    '--radius': radius + 'px',
  }

  return (
    <div className="app" data-density={density} style={rootStyle}>
      <div className="phone">
        <div className="phone-glow" />
        <div className="phone-scroll">
          {tab === 'home'    && <Home {...shared} />}
          {tab === 'assess'  && <Assessment {...shared} />}
          {tab === 'train'   && <TrainHub {...shared} />}
          {tab === 'vitals'  && <Vitals {...shared} />}
          {tab === 'goals'   && <Goals {...shared} />}
          {tab === 'more'    && (
            <More {...shared}
              accent={accent} setAccent={setAccent}
              glow={glow} setGlow={setGlow}
              radius={radius} setRadius={setRadius}
              density={density} setDensity={setDensity}
              accentOptions={ACCENT_OPTIONS}
              sync={sync}
              sheets={sheets}
            />
          )}
        </div>

        <button className="fab" onClick={() => setLog(true)} aria-label="Quick log">
          <Icon name="plus" size={26} stroke={2.4} />
        </button>

        <nav className="nav">
          {NAV.map(({ id, label, icon }) => (
            <button
              key={id}
              className={`nav-b ${(tab === id || (id === 'home' && tab === 'assess')) ? 'on' : ''}`}
              onClick={() => go(id)}
            >
              <Icon name={icon} size={22} stroke={tab === id ? 2.1 : 1.7} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {log && <QuickLog onClose={() => setLog(false)} />}
      </div>
    </div>
  )
}
