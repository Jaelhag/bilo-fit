import { useState } from 'react'
import { Icon } from '../lib/icons.jsx'
import { Card, Label, Spark, Bars, Ring, DateField, todayStr, dateToISO } from '../lib/charts.jsx'
import { classifyBP, bpTrend, rollingAvg, sleepDuration, SLEEP_FACES, SLEEP_LABELS, weightTrendText, todaysMedKey, medComplianceStreak } from '../data/health.js'

export default function Vitals({ state, update }) {
  const [tab, setTab] = useState('health')

  return (
    <div className="screen">
      <header className="hd"><div className="hd-hi">Vitals</div></header>

      <div className="seg">
        <button className={`seg-b ${tab === 'health' ? 'on' : ''}`} onClick={() => setTab('health')}>Health</button>
        <button className={`seg-b ${tab === 'meds' ? 'on' : ''}`} onClick={() => setTab('meds')}>Meds</button>
        <button className={`seg-b ${tab === 'log' ? 'on' : ''}`} onClick={() => setTab('log')}>Training log</button>
      </div>

      {tab === 'health' && <HealthTab state={state} update={update} />}
      {tab === 'meds'   && <MedsTab   state={state} update={update} />}
      {tab === 'log'    && <TrainingLog state={state} />}

      <div className="botpad" />
    </div>
  )
}

// ============================================================
// HEALTH TAB — BP, sleep, weight, quick log
// ============================================================
function HealthTab({ state, update }) {
  return (
    <>
      <BPSection state={state} update={update} />
      <SleepSection state={state} update={update} />
      <WeightSection state={state} update={update} />
    </>
  )
}

// ---- Blood Pressure ----
function BPSection({ state, update }) {
  const [sys, setSys]   = useState('')
  const [dia, setDia]   = useState('')
  const [pulse, setPulse] = useState('')
  const [note, setNote] = useState('')
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [logDate, setLogDate] = useState(todayStr())

  const logs = [...(state.bpLog || [])].sort((a,b) => new Date(a.date) - new Date(b.date))
  const latest = logs[logs.length - 1]
  const cls = latest ? classifyBP(latest.sys, latest.dia) : null
  const trend = bpTrend(logs)

  const sparkSys = logs.slice(-14).map((l) => l.sys)
  const sparkDia = logs.slice(-14).map((l) => l.dia)
  const days = ['S','M','T','W','T','F','S']

  const save = () => {
    if (!sys || !dia) return
    update((s) => {
      s.bpLog = s.bpLog || []
      s.bpLog.push({
        id: `bp_${Date.now()}`,
        date: dateToISO(logDate),
        sys: parseInt(sys,10), dia: parseInt(dia,10),
        pulse: pulse ? parseInt(pulse,10) : null,
        note,
      })
    })
    setSys(''); setDia(''); setPulse(''); setNote(''); setSaved(true); setOpen(false)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Card glow>
      <div className="row-between">
        <Label icon="drop">Blood pressure</Label>
        {cls && <span className="badge" style={{ color: cls.color, borderColor: cls.color + '55' }}>{cls.badge}</span>}
      </div>

      {latest ? (
        <>
          <div className="bp-now" style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '10px 0 4px' }}>
            <span style={{ fontSize: 40, fontWeight: 700, fontFamily: 'var(--mono)' }}>
              {latest.sys}<span style={{ color: 'var(--muted)', fontSize: 24, margin: '0 3px' }}>/</span>{latest.dia}
            </span>
            {latest.pulse && <span className="muted sm mono">{latest.pulse} bpm</span>}
          </div>
          <div className="muted sm mono">{fmtDateFull(latest.date)}{latest.note ? ` · ${latest.note}` : ''}</div>
          {trend && (
            <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: trend.color }}>
              {trend.label} <span className="muted" style={{ fontWeight: 400 }}>(vs 4-7 days ago)</span>
            </div>
          )}
          {sparkSys.length >= 2 && (
            <div style={{ marginTop: 10, position: 'relative' }}>
              <Spark data={sparkSys} h={48} color="var(--accent)" fill={false} dots />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, pointerEvents: 'none' }}>
                <Spark data={sparkDia} h={48} color="rgba(120,170,255,.45)" fill={false} />
              </div>
              <div className="legend mono" style={{ marginTop: 4 }}>
                <span><i className="dotc" style={{ background: 'var(--accent)' }} />Systolic</span>
                <span><i className="dotc" style={{ background: 'rgba(120,170,255,.6)' }} />Diastolic</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="muted sm" style={{ margin: '10px 0' }}>No readings yet. Log your first one below.</p>
      )}

      {!open && (
        <button className="logbtn" style={{ marginTop: 10, width: '100%', padding: 11, borderRadius: 11, border: '1px solid var(--line2)', background: 'var(--panel2)', color: 'var(--accent)', fontFamily: 'inherit', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          onClick={() => setOpen(true)}>
          <Icon name="plus" size={15} stroke={2.4} /> Log reading
        </button>
      )}
      {saved && <div className="check-ok" style={{ marginTop: 8 }}><Icon name="check" size={13} stroke={2.6} /> Saved ✓</div>}

      {open && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <DateField value={logDate} onChange={setLogDate} label="Reading date" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div><label className="lbl">Systolic</label>
              <input className="inp" type="number" placeholder="118" value={sys} onChange={(e) => setSys(e.target.value)} autoFocus /></div>
            <div><label className="lbl">Diastolic</label>
              <input className="inp" type="number" placeholder="76" value={dia} onChange={(e) => setDia(e.target.value)} /></div>
            <div><label className="lbl">Pulse</label>
              <input className="inp" type="number" placeholder="62" value={pulse} onChange={(e) => setPulse(e.target.value)} /></div>
          </div>
          <input className="inp" type="text" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn primary" style={{ flex: 1 }} disabled={!sys || !dia} onClick={save}>Save</button>
            <button className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
          </div>
          {sys && dia && (() => { const c = classifyBP(parseInt(sys,10), parseInt(dia,10)); return c ? <div style={{ fontSize: 13, color: c.color, fontWeight: 600 }}>{c.label} — {c.badge}</div> : null })()}
        </div>
      )}

      {/* Last 5 readings */}
      {logs.length > 1 && (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
          <div className="muted sm" style={{ marginBottom: 6 }}>Recent readings</div>
          {logs.slice(-5).reverse().map((l) => {
            const c = classifyBP(l.sys, l.dia)
            return (
              <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid var(--line)', fontSize: 13 }}>
                <span className="mono">{l.sys}/{l.dia}{l.pulse ? ` · ${l.pulse}bpm` : ''}</span>
                <span style={{ color: c?.color, fontWeight: 600, fontSize: 11 }}>{c?.badge}</span>
                <span className="muted sm">{fmtDate(l.date)}</span>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

// ---- Sleep ----
function SleepSection({ state, update }) {
  const [open, setOpen]   = useState(false)
  const [bed, setBed]     = useState('22:30')
  const [wake, setWake]   = useState('06:30')
  const [q, setQ]         = useState(null)
  const [disrupt, setDisrupt] = useState(false)
  const [note, setNote]   = useState('')
  const [saved, setSaved] = useState(false)
  const [logDate, setLogDate] = useState(todayStr())

  const logs = [...(state.sleepLog || [])].sort((a,b) => new Date(a.date) - new Date(b.date))
  const last = logs[logs.length - 1]
  const recentHours = logs.slice(-7).map((l) => l.durationHours || 0)
  const avgHours = recentHours.length ? Math.round(recentHours.reduce((a,b) => a+b,0) / recentHours.length * 10) / 10 : null
  const days = ['S','M','T','W','T','F','S']

  const loggedToday = last && last.date.slice(0,10) === new Date().toISOString().slice(0,10)

  const save = () => {
    const dur = sleepDuration(bed, wake)
    update((s) => {
      s.sleepLog = s.sleepLog || []
      s.sleepLog.push({
        id: `sl_${Date.now()}`,
        date: dateToISO(logDate),
        bedtime: bed, wakeTime: wake,
        durationHours: dur,
        quality: q,
        disruptions: disrupt,
        note,
      })
    })
    setOpen(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const dur = bed && wake ? sleepDuration(bed, wake) : null

  return (
    <Card glow>
      <div className="row-between">
        <Label icon="moon">Sleep · last night</Label>
        {last?.quality && (
          <Ring value={last.quality / 5} size={42} stroke={5} label={SLEEP_FACES[last.quality]} glow={false} />
        )}
      </div>

      {last ? (
        <>
          <div style={{ fontSize: 40, fontWeight: 700, fontFamily: 'var(--mono)', margin: '8px 0 2px' }}>
            {last.durationHours}<span style={{ fontSize: 16, color: 'var(--muted)', marginLeft: 3 }}>hrs</span>
          </div>
          <div className="muted sm">
            {last.bedtime} → {last.wakeTime} · {SLEEP_LABELS[last.quality] || ''}
            {last.disruptions ? ' · woke up' : ''}
            {last.note ? ` · ${last.note}` : ''}
          </div>
          {avgHours && <div style={{ marginTop: 4, fontSize: 13, color: 'var(--muted)' }}>7-day avg: <strong style={{ color: avgHours >= 7 ? '#36e0a8' : '#f5a524', fontFamily: 'var(--mono)' }}>{avgHours}h</strong></div>}
          {recentHours.length >= 2 && <Bars data={recentHours} h={48} labels={days.slice(-(recentHours.length))} />}
        </>
      ) : (
        <p className="muted sm" style={{ margin: '10px 0' }}>No sleep logs yet.</p>
      )}

      {!open && !loggedToday && (
        <button className="logbtn" style={{ marginTop: 10, width: '100%', padding: 11, borderRadius: 11, border: '1px solid var(--line2)', background: 'var(--panel2)', color: 'var(--accent)', fontFamily: 'inherit', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          onClick={() => setOpen(true)}>
          <Icon name="moon" size={15} stroke={2} /> Log last night
        </button>
      )}
      {saved && <div className="check-ok" style={{ marginTop: 8 }}><Icon name="check" size={13} stroke={2.6} /> Logged ✓</div>}
      {loggedToday && !open && <div className="check-ok" style={{ marginTop: 8 }}><Icon name="check" size={13} stroke={2.6} /> Today's sleep logged</div>}

      {open && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <DateField value={logDate} onChange={setLogDate} label="Morning of" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div><label className="lbl">Bedtime</label>
              <input className="inp" type="time" value={bed} onChange={(e) => setBed(e.target.value)} /></div>
            <div><label className="lbl">Wake time</label>
              <input className="inp" type="time" value={wake} onChange={(e) => setWake(e.target.value)} /></div>
          </div>
          {dur && <div className="muted sm mono" style={{ textAlign: 'center' }}>= {dur} hours</div>}
          <div>
            <div className="lbl">Sleep quality</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              {[1,2,3,4,5].map((v) => (
                <button key={v} onClick={() => setQ(v)} style={{ fontSize: 28, border: `1px solid ${q===v ? 'var(--accent)' : 'var(--line)'}`, borderRadius: 12, width: 52, height: 52, cursor: 'pointer', filter: q===v ? 'none' : 'grayscale(.5)', transform: q===v ? 'translateY(-2px)' : 'none', transition: '.15s', display: 'grid', placeItems: 'center', background: q===v ? 'color-mix(in oklab, var(--accent) 15%, transparent)' : 'var(--panel2)' }}>
                  {SLEEP_FACES[v]}
                </button>
              ))}
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--txt)', cursor: 'pointer' }}>
            <input type="checkbox" checked={disrupt} onChange={(e) => setDisrupt(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} />
            Woke up during the night
          </label>
          <input className="inp" type="text" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn primary" style={{ flex: 1 }} onClick={save}>Save</button>
            <button className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </Card>
  )
}

// ---- Weight ----
function WeightSection({ state, update }) {
  const [open, setOpen]   = useState(false)
  const [wt, setWt]       = useState('')
  const [note, setNote]   = useState('')
  const [saved, setSaved] = useState(false)
  const [logDate, setLogDate] = useState(todayStr())

  const logs = [...(state.weightLog || [])].sort((a,b) => new Date(a.date) - new Date(b.date))
  const latest = logs[logs.length - 1]
  const avg7 = rollingAvg(logs, 7)
  const trend = weightTrendText(logs)
  const sparkData = logs.slice(-14).map((l) => l.weight)
  const loggedToday = latest && latest.date.slice(0,10) === new Date().toISOString().slice(0,10)

  const save = () => {
    if (!wt) return
    update((s) => {
      s.weightLog = s.weightLog || []
      s.weightLog.push({ id: `wt_${Date.now()}`, date: dateToISO(logDate), weight: parseFloat(wt), note })
    })
    setWt(''); setNote(''); setOpen(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Card glow>
      <Label icon="trend">Weight</Label>
      {latest ? (
        <>
          <div style={{ fontSize: 40, fontWeight: 700, fontFamily: 'var(--mono)', margin: '8px 0 2px' }}>
            {latest.weight}<span style={{ fontSize: 16, color: 'var(--muted)', marginLeft: 3 }}>lb</span>
          </div>
          {avg7 && <div className="muted sm">7-day avg: <strong style={{ fontFamily: 'var(--mono)', color: 'var(--txt)' }}>{avg7} lb</strong></div>}
          {trend && <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color: trend.color }}>{trend.label}</div>}
          {sparkData.length >= 2 && <div style={{ marginTop: 8 }}><Spark data={sparkData} h={48} dots /></div>}
        </>
      ) : (
        <p className="muted sm" style={{ margin: '10px 0' }}>No weigh-ins logged yet.</p>
      )}

      {!open && !loggedToday && (
        <button className="logbtn" style={{ marginTop: 10, width: '100%', padding: 11, borderRadius: 11, border: '1px solid var(--line2)', background: 'var(--panel2)', color: 'var(--accent)', fontFamily: 'inherit', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          onClick={() => setOpen(true)}>
          <Icon name="plus" size={15} stroke={2.4} /> Log weight
        </button>
      )}
      {saved && <div className="check-ok" style={{ marginTop: 8 }}><Icon name="check" size={13} stroke={2.6} /> Logged ✓</div>}
      {loggedToday && !open && <div className="check-ok" style={{ marginTop: 8 }}><Icon name="check" size={13} stroke={2.6} /> Weighed in today</div>}

      {open && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <DateField value={logDate} onChange={setLogDate} label="Weigh-in date" />
          <div><label className="lbl">Weight (lb)</label>
            <input className="inp" type="number" step="0.1" placeholder="e.g. 178.5" value={wt} onChange={(e) => setWt(e.target.value)} autoFocus /></div>
          <input className="inp" type="text" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn primary" style={{ flex: 1 }} disabled={!wt} onClick={save}>Save</button>
            <button className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </Card>
  )
}

// ============================================================
// MEDS TAB
// ============================================================
function MedsTab({ state, update }) {
  const [showSetup, setShowSetup] = useState(false)

  return (
    <>
      {(state.medications || []).length === 0 && !showSetup && (
        <Card>
          <Label icon="shield">Medications</Label>
          <p className="muted sm" style={{ margin: '10px 0' }}>
            No medications added yet. Add your medications and the app will track your daily compliance.
          </p>
          <button className="btn primary" onClick={() => setShowSetup(true)}>
            + Add a medication
          </button>
        </Card>
      )}

      {(state.medications || []).length > 0 && (
        <MedCheckinCard state={state} update={update} />
      )}

      {(state.medications || []).length > 0 && (
        <MedHistoryCard state={state} />
      )}

      {(state.medications || []).length > 0 && !showSetup && (
        <button className="btn" style={{ width: '100%' }} onClick={() => setShowSetup(true)}>
          + Add another medication
        </button>
      )}

      {showSetup && <MedSetupCard state={state} update={update} onDone={() => setShowSetup(false)} />}

      {/* Existing meds list */}
      {(state.medications || []).length > 0 && (
        <Card>
          <Label icon="shield">Your medications</Label>
          {state.medications.map((med) => {
            const streak = medComplianceStreak(state.medLog || {}, med.id)
            return (
              <div key={med.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--line)', marginTop: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {med.name}{med.strength ? <span className="muted" style={{ fontWeight: 500 }}> {med.strength}</span> : null}
                  </div>
                  <div className="muted sm">
                    {med.doses.map((d) => [d.amount, fmtTime(d.time)].filter(Boolean).join(' ')).join(' · ')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {streak > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#36e0a8', fontWeight: 600, fontSize: 13 }}>
                      <Icon name="flame" size={13} stroke={2} />
                      {streak} day streak
                    </div>
                  )}
                  <button className="link" style={{ fontSize: 12, marginTop: 2 }}
                    onClick={() => {
                      if (window.confirm(`Remove ${med.name}?`)) {
                        update((s) => { s.medications = s.medications.filter((m) => m.id !== med.id) })
                      }
                    }}>Remove</button>
                </div>
              </div>
            )
          })}
        </Card>
      )}
    </>
  )
}

function MedCheckinCard({ state, update }) {
  const todayKey = todaysMedKey()
  const todayLog = state.medLog?.[todayKey] || {}

  const toggle = (medId, doseId) => {
    update((s) => {
      const key = `${medId}-${doseId}`
      if (!s.medLog) s.medLog = {}
      if (!s.medLog[todayKey]) s.medLog[todayKey] = {}
      const cur = s.medLog[todayKey][key]
      if (cur?.taken) {
        delete s.medLog[todayKey][key]
      } else {
        s.medLog[todayKey][key] = { medId, doseId, taken: true, takenAt: new Date().toISOString() }
      }
    })
  }

  const allDoses = (state.medications || []).flatMap((med) =>
    med.doses.map((dose) => ({ med, dose, key: `${med.id}-${dose.id}`, taken: !!todayLog[`${med.id}-${dose.id}`]?.taken }))
  )
  const doneCount = allDoses.filter((d) => d.taken).length

  return (
    <Card glow>
      <div className="row-between">
        <Label icon="shield">Today's medications</Label>
        <span className="mono" style={{ color: doneCount === allDoses.length ? '#36e0a8' : 'var(--muted)', fontWeight: 700 }}>
          {doneCount}/{allDoses.length}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {allDoses.map(({ med, dose, key, taken }) => (
          <button key={key} onClick={() => toggle(med.id, dose.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', border: `1px solid ${taken ? '#36e0a855' : 'var(--line)'}`, borderRadius: 12, background: taken ? 'rgba(54,224,168,.08)' : 'var(--panel2)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
            <div style={{ width: 24, height: 24, borderRadius: 8, border: `2px solid ${taken ? '#36e0a8' : 'var(--line2)'}`, background: taken ? '#36e0a8' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0, color: '#fff', transition: '.15s' }}>
              {taken && <Icon name="check" size={13} stroke={3} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: taken ? 'var(--muted)' : 'var(--txt)', textDecoration: taken ? 'line-through' : 'none' }}>
                {med.name}{med.strength ? <span className="muted" style={{ fontWeight: 500 }}> {med.strength}</span> : null}
              </div>
              <div className="muted sm">{doseDetail(dose)}</div>
            </div>
            {taken && <span style={{ fontSize: 11, color: '#36e0a8' }}>✓ taken</span>}
          </button>
        ))}
      </div>
      {doneCount === allDoses.length && allDoses.length > 0 && (
        <div className="check-ok" style={{ marginTop: 12 }}>
          <Icon name="check" size={13} stroke={2.6} /> All medications taken today!
        </div>
      )}
    </Card>
  )
}

function MedHistoryCard({ state }) {
  const meds = state.medications || []
  if (!meds.length) return null

  // Last 7 days compliance per med
  const days7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
  const dayLabels = ['Su','Mo','Tu','We','Th','Fr','Sa']

  return (
    <Card>
      <Label icon="trend">7-day compliance</Label>
      {meds.map((med) => {
        const totalDoses = med.doses.length
        const scores = days7.map((day) => {
          const dayLog = state.medLog?.[day] || {}
          const taken = med.doses.filter((d) => dayLog[`${med.id}-${d.id}`]?.taken).length
          return totalDoses ? taken / totalDoses : 0
        })
        const overallPct = Math.round(scores.reduce((a,b) => a+b,0) / scores.length * 100)
        return (
          <div key={med.id} style={{ marginTop: 12 }}>
            <div className="row-between" style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{med.name}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: overallPct >= 80 ? '#36e0a8' : overallPct >= 50 ? '#f5a524' : '#ff8087', fontWeight: 700 }}>{overallPct}%</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {scores.map((s, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: '100%', height: 28, borderRadius: 6, background: s === 1 ? '#36e0a8' : s > 0 ? '#f5a524' : 'var(--line2)' }} />
                  <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{dayLabels[new Date(days7[i]).getDay()]}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </Card>
  )
}

function MedSetupCard({ state, update, onDone }) {
  const [name, setName]       = useState('')
  const [strength, setStrength] = useState('')
  const [doses, setDoses]     = useState([{ id: 'd1', time: '08:00', label: 'Morning', amount: '' }])

  const addDose = () => setDoses((p) => [...p, { id: `d${Date.now()}`, time: '20:00', label: 'Evening', amount: '' }])
  const removeDose = (id) => setDoses((p) => p.filter((d) => d.id !== id))
  const editDose = (id, k, v) => setDoses((p) => p.map((d) => d.id === id ? { ...d, [k]: v } : d))

  const save = () => {
    if (!name.trim()) return
    update((s) => {
      s.medications = s.medications || []
      s.medications.push({ id: `med_${Date.now()}`, name: name.trim(), strength: strength.trim(), doses })
    })
    onDone()
  }

  return (
    <Card glow>
      <Label icon="shield">Add medication</Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 8 }}>
          <div>
            <label className="lbl">Medication name</label>
            <input className="inp" type="text" placeholder="e.g. Lisinopril" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="lbl">Strength</label>
            <input className="inp" type="text" placeholder="10 mg" value={strength} onChange={(e) => setStrength(e.target.value)} />
          </div>
        </div>

        <div className="lbl" style={{ marginTop: 4 }}>Doses</div>
        {doses.map((dose, i) => (
          <div key={dose.id} style={{ background: 'var(--panel2)', border: '1px solid var(--line)', borderRadius: 12, padding: 12 }}>
            <div className="row-between" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>Dose {i + 1}</span>
              {doses.length > 1 && (
                <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }} onClick={() => removeDose(dose.id)}>
                  <Icon name="x" size={14} stroke={2} />
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <label className="lbl">Time</label>
                <input className="inp" type="time" value={dose.time} onChange={(e) => editDose(dose.id, 'time', e.target.value)} />
              </div>
              <div>
                <label className="lbl">Amount</label>
                <input className="inp" type="text" placeholder="1 tablet" value={dose.amount} onChange={(e) => editDose(dose.id, 'amount', e.target.value)} />
              </div>
              <div>
                <label className="lbl">Label</label>
                <input className="inp" type="text" placeholder="Morning" value={dose.label} onChange={(e) => editDose(dose.id, 'label', e.target.value)} />
              </div>
            </div>
          </div>
        ))}

        <button className="link" onClick={addDose} style={{ alignSelf: 'flex-start' }}>
          + Add another dose time
        </button>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn primary" style={{ flex: 1 }} disabled={!name.trim()} onClick={save}>Save medication</button>
          <button className="btn ghost" onClick={onDone}>Cancel</button>
        </div>
      </div>
    </Card>
  )
}

// Build the display string for a dose, e.g. "Morning · 1 tablet · 8:00 AM"
function doseDetail(dose) {
  const parts = []
  if (dose.label) parts.push(dose.label)
  if (dose.amount) parts.push(dose.amount)
  parts.push(fmtTime(dose.time))
  return parts.join(' · ')
}
function fmtTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`
}

// ============================================================
// TRAINING LOG SUB-TAB
// ============================================================
function TrainingLog({ state }) {
  const mobSessions  = (state.sessions || []).map((s) => ({ ...s, _kind: 'mobility' }))
  const condSessions = (state.conditioningSessions || []).map((s) => ({ ...s, _kind: 'conditioning' }))
  const all = [...mobSessions, ...condSessions].sort((a,b) => new Date(b.date) - new Date(a.date))

  if (!all.length) return (
    <Card><p className="muted sm">No sessions logged yet.</p></Card>
  )

  const TYPE_EMOJI = { explosive:'⚡', 'upper-lift':'💪', 'lower-lift':'🦵', 'echo-bike':'🚴', zone2:'🚶', mobility:'🤸' }

  return (
    <>
      {all.map((s) => (
        <Card key={s.id}>
          <div className="row-between">
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {s._kind === 'conditioning' ? `${TYPE_EMOJI[s.type]||'🏋️'} ${s.type?.replace(/-/g,' ')}` : `🤸 ${s.goalId?.replace(/-/g,' ')}`}
              </div>
              <div className="muted sm">{fmtDateFull(s.date)}</div>
            </div>
            {s.type === 'echo-bike' && s.data?.hrMax && <span className="badge">HR {s.data.hrMax}</span>}
            {s._kind === 'mobility'  && s.drills && <span className="badge">{s.drills.length} drills</span>}
          </div>
          {s.note && <div style={{ marginTop: 6, fontSize: 13, color: '#b0bde8', fontStyle: 'italic' }}>{s.note}</div>}
        </Card>
      ))}
    </>
  )
}

// ---- Helpers ----
function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
  catch { return iso }
}
function fmtDateFull(iso) {
  try { return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) }
  catch { return iso }
}
