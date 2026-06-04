import { useState } from 'react'
import { Icon } from '../lib/icons.jsx'
import { Card, Label } from '../lib/charts.jsx'
import { visibleQuestions } from '../data/assessments.js'
import { generateProgram } from '../lib/engine.js'

export default function Assessment({ state, update, activeGoal, goTo }) {
  const existing = state.assessments[activeGoal.id]?.answers || {}
  const [answers, setAnswers] = useState(existing)

  const questions = visibleQuestions(activeGoal.id, answers)
  const answered  = questions.filter((q) => answers[q.id] != null).length
  const allDone   = answered === questions.length

  const choose = (qid, value) => {
    setAnswers((prev) => {
      const next = { ...prev, [qid]: value }
      const still = new Set(visibleQuestions(activeGoal.id, next).map((q) => q.id))
      Object.keys(next).forEach((k) => { if (!still.has(k)) delete next[k] })
      return next
    })
  }

  const build = () => {
    const program = generateProgram(activeGoal.id, answers)
    update((s) => {
      s.assessments[activeGoal.id] = { answers, generatedAt: new Date().toISOString() }
      s.programs[activeGoal.id] = program
    })
    goTo('home')
  }

  return (
    <div className="screen">
      <header className="hd">
        <div>
          <div className="hd-hi">Assessment</div>
          <div className="hd-sub mono">{activeGoal.emoji} {activeGoal.name.toUpperCase()}</div>
        </div>
      </header>

      <Card>
        <Label icon="bolt">Build your program</Label>
        <p className="muted sm" style={{ marginTop: 8 }}>
          Answer honestly — this picks your exact drills from the course. You can redo it any time.
        </p>
      </Card>

      {questions.map((q, qi) => (
        <Card key={q.id}
          style={{
            borderColor: answers[q.id] ? 'color-mix(in oklab, var(--accent) 40%, transparent)' : 'var(--line)',
          }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
            <div className="slot" style={{ flexShrink: 0, marginTop: 1 }}>{qi + 1}</div>
            <div>
              <div className="q">{q.q}</div>
              {q.help && <p className="muted sm" style={{ marginTop: 4 }}>{q.help}</p>}
            </div>
          </div>
          <div className="opts">
            {q.options.map((o) => (
              <button key={o.value}
                className={`opt ${answers[q.id] === o.value ? 'sel' : ''}`}
                onClick={() => choose(q.id, o.value)}>
                {answers[q.id] === o.value && (
                  <Icon name="check" size={14} stroke={2.6}
                    style={{ color: 'var(--accent)', marginRight: 8, verticalAlign: 'middle' }} />
                )}
                {o.label}
              </button>
            ))}
          </div>
        </Card>
      ))}

      <div className="sticky-actions">
        <button className="btn primary big" disabled={!allDone} onClick={build}>
          {allDone
            ? <><Icon name="spark" size={16} stroke={2} style={{ verticalAlign: 'middle', marginRight: 6 }} />Build my program</>
            : `Answer all questions (${answered}/${questions.length})`
          }
        </button>
      </div>
      <div className="botpad" />
    </div>
  )
}
