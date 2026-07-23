import { useState } from 'react'
import './scope.css'
import {
  PROJECT_TYPES, PROJECT_BY_ID, FEATURES, SCALES, DESIGNS,
  BUDGETS, BUDGET_BY_ID, DEADLINES, DEADLINE_BY_ID,
} from './catalog.js'
import { buildBrief } from './brief.js'
import { polishSummary } from './summarize.js'
import { downloadBrief } from './pdf.js'
import { SCOPE_PROXY } from './config.js'

const EMPTY = {
  projectType: '',
  brief: '',
  features: [],
  scale: 'medium',
  design: 'template',
  budget: '',
  deadline: '',
  contact: { name: '', email: '', company: '' },
}

const STEPS = ['Project', 'Features', 'Details', 'You']

export default function ScopeGenerator() {
  const [step, setStep] = useState(0)
  const [intake, setIntake] = useState(EMPTY)
  const [result, setResult] = useState(null)

  const set = (patch) => setIntake((s) => ({ ...s, ...patch }))
  const setContact = (patch) => setIntake((s) => ({ ...s, contact: { ...s.contact, ...patch } }))
  const toggleFeature = (id) =>
    setIntake((s) => ({
      ...s,
      features: s.features.includes(id) ? s.features.filter((f) => f !== id) : [...s.features, id],
    }))

  function generate() {
    const brief = buildBrief(intake)
    setResult({ brief, polishing: !!SCOPE_PROXY })
    if (SCOPE_PROXY) {
      polishSummary(intake, brief).then(({ summary, source }) =>
        setResult((r) => (r ? { ...r, brief: { ...r.brief, summary, summarySource: source }, polishing: false } : r)),
      )
    }
  }

  const reset = () => { setIntake(EMPTY); setResult(null); setStep(0) }

  if (result) return <Result intake={intake} brief={result.brief} polishing={result.polishing} onReset={reset} />

  const canNext = step !== 0 || !!intake.projectType
  const last = step === STEPS.length - 1
  const project = intake.projectType ? PROJECT_BY_ID[intake.projectType] : null

  return (
    <div className="sg">
      <header className="sg-head">
        <div className="sg-brand"><span className="sg-logo">💼</span> Start a Project</div>
        <div className="sg-steps">
          {STEPS.map((s, i) => (
            <span key={s} className={`sg-step${i === step ? ' on' : ''}${i < step ? ' done' : ''}`}>{s}</span>
          ))}
        </div>
      </header>

      <div className="sg-body">
        {step === 0 && (
          <>
            <h2 className="sg-q">What are you building?</h2>
            <div className="sg-grid">
              {PROJECT_TYPES.map((p) => (
                <button
                  key={p.id}
                  className={`sg-card${intake.projectType === p.id ? ' sel' : ''}`}
                  onClick={() => set({ projectType: p.id })}
                >
                  <span className="sg-card-icon">{p.icon}</span>
                  <span className="sg-card-label">{p.label}</span>
                  <span className="sg-card-blurb">{p.blurb}</span>
                </button>
              ))}
            </div>
            <textarea
              className="sg-brief"
              placeholder="Tell me about it — the goal, who it's for, anything specific. (optional)"
              maxLength={600}
              value={intake.brief}
              onChange={(e) => set({ brief: e.target.value })}
            />
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="sg-q">What does it need?</h2>
            <p className="sg-sub">Tap everything that applies. You can keep it lean.</p>
            <div className="sg-chips">
              {FEATURES.map((f) => (
                <button
                  key={f.id}
                  className={`sg-chip${intake.features.includes(f.id) ? ' sel' : ''}`}
                  onClick={() => toggleFeature(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="sg-q">A few details</h2>
            <Segment label="Scale" options={SCALES} value={intake.scale} onPick={(id) => set({ scale: id })} />
            <Segment label="Design" options={DESIGNS} value={intake.design} onPick={(id) => set({ design: id })} />
            <Select label="Budget in mind?" hint="optional — helps me right-size the scope"
              options={BUDGETS} value={intake.budget} onPick={(id) => set({ budget: id })} placeholder="Prefer not to say" />
            <Select label="When do you need it?" options={DEADLINES} value={intake.deadline}
              onPick={(id) => set({ deadline: id })} placeholder="Not sure yet" />
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="sg-q">Where should I send it?</h2>
            <p className="sg-sub">Leave an email and I&rsquo;ll follow up personally.</p>
            <div className="sg-fields">
              <input className="sg-input" placeholder="Your name" value={intake.contact.name}
                onChange={(e) => setContact({ name: e.target.value })} />
              <input className="sg-input" placeholder="Company (optional)" value={intake.contact.company}
                onChange={(e) => setContact({ company: e.target.value })} />
              <input className="sg-input" type="email" placeholder="Email" value={intake.contact.email}
                onChange={(e) => setContact({ email: e.target.value })} />
            </div>
          </>
        )}
      </div>

      <footer className="sg-foot">
        <div className="sg-est">
          {project ? (
            <><b>{project.label}</b><span className="sg-est-sep">·</span><span>{intake.features.length} feature{intake.features.length === 1 ? '' : 's'}</span></>
          ) : (
            <span className="sg-muted">Tell me what you&rsquo;re building</span>
          )}
        </div>
        <div className="sg-nav">
          {step > 0 && <button className="sg-btn ghost" onClick={() => setStep(step - 1)}>Back</button>}
          {!last && <button className="sg-btn" disabled={!canNext} onClick={() => setStep(step + 1)}>Next</button>}
          {last && <button className="sg-btn primary" onClick={generate}>Review &amp; send →</button>}
        </div>
      </footer>
    </div>
  )
}

function Segment({ label, options, value, onPick }) {
  return (
    <div className="sg-seg-row">
      <div className="sg-seg-label">{label}</div>
      <div className="sg-seg">
        {options.map((o) => (
          <button key={o.id} className={`sg-seg-opt${value === o.id ? ' sel' : ''}`} onClick={() => onPick(o.id)}>
            <b>{o.label}</b><small>{o.detail}</small>
          </button>
        ))}
      </div>
    </div>
  )
}

function Select({ label, hint, options, value, onPick, placeholder }) {
  return (
    <div className="sg-seg-row">
      <div className="sg-seg-label">{label}{hint ? <span className="sg-seg-hint"> — {hint}</span> : null}</div>
      <select className="sg-select" value={value} onChange={(e) => onPick(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </div>
  )
}

function Result({ intake, brief, polishing, onReset }) {
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [answers, setAnswers] = useState({})

  const budgetLabel = brief.budget ? BUDGET_BY_ID[brief.budget].label : 'Not specified'
  const deadlineLabel = brief.deadline ? DEADLINE_BY_ID[brief.deadline].label : 'Not specified'

  const answered = brief.questions
    .map((q, i) => ({ q, a: (answers[i] || '').trim() }))
    .filter((x) => x.a)

  const asText =
    `Project brief\n\n${brief.summary}\n\n` +
    `Includes:\n${brief.lineItems.map((l) => `• ${l.label}`).join('\n')}\n\n` +
    `Budget: ${budgetLabel}\nTimeline: ${deadlineLabel}\n` +
    (intake.brief ? `\nNotes: ${intake.brief}\n` : '') +
    (answered.length ? `\nFollow-ups:\n${answered.map((x) => `• ${x.q}\n  ${x.a}`).join('\n')}\n` : '') +
    (intake.contact.name || intake.contact.company || intake.contact.email
      ? `\nFrom: ${[intake.contact.name, intake.contact.company, intake.contact.email].filter(Boolean).join(' · ')}` : '')

  const mailto =
    `mailto:noeljacksonjs@gmail.com?subject=${encodeURIComponent('Project inquiry — ' + PROJECT_BY_ID[intake.projectType].label)}` +
    `&body=${encodeURIComponent(asText + '\n\n— sent from the project form on sturdyrobot.io')}`

  async function pdf() {
    setBusy(true)
    try { await downloadBrief(brief, intake, answers) } finally { setBusy(false) }
  }
  function copy() {
    navigator.clipboard?.writeText(asText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600) })
  }

  return (
    <div className="sg sg-result">
      <header className="sg-head">
        <div className="sg-brand"><span className="sg-logo">💼</span> Your brief</div>
        <span className={`sg-badge ${brief.summarySource === 'ai' ? 'ai' : ''}`}>
          {polishing ? 'polishing…' : brief.summarySource === 'ai' ? 'AI-polished' : 'ready'}
        </span>
      </header>

      <div className="sg-body">
        <div className="sg-headline">
          <div>
            <div className="sg-headline-lbl">BUDGET</div>
            <div className="sg-headline-val">{budgetLabel}</div>
          </div>
          <div className="sg-headline-r">
            <div className="sg-headline-lbl">TIMELINE</div>
            <div className="sg-headline-val">{deadlineLabel}</div>
          </div>
        </div>

        <p className="sg-summary">{brief.summary}</p>

        <div className="sg-lines-label">What&rsquo;s typically involved</div>
        <div className="sg-lines">
          {brief.lineItems.map((l) => (
            <div className="sg-line" key={l.id}>
              <span className="sg-line-label">{l.label}</span>
            </div>
          ))}
        </div>

        {polishing && brief.questions.length === 0 ? (
          <p className="sg-thinking">Thinking about what I&rsquo;d ask you…</p>
        ) : null}

        {brief.questions.length > 0 ? (
          <div className="sg-qa">
            <div className="sg-lines-label">A few things I&rsquo;d want to nail down</div>
            {brief.questions.map((q, i) => (
              <div className="sg-qa-item" key={i}>
                <div className="sg-qa-q">{q}</div>
                <textarea
                  className="sg-qa-a"
                  rows={2}
                  placeholder="Your answer (optional — but it helps me quote faster)"
                  value={answers[i] || ''}
                  onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        ) : null}

        {intake.brief ? <p className="sg-note"><b>Your notes:</b> {intake.brief}</p> : null}

        <details className="sg-assume">
          <summary>How I work</summary>
          <ul>{brief.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </details>
      </div>

      <footer className="sg-foot sg-foot-result">
        <button className="sg-btn ghost" onClick={onReset}>Start over</button>
        <div className="sg-nav">
          <button className="sg-btn ghost" onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</button>
          <button className="sg-btn" onClick={pdf} disabled={busy}>{busy ? 'Building…' : 'Download PDF'}</button>
          <a className="sg-btn primary" href={mailto}>Send to Noel →</a>
        </div>
      </footer>
    </div>
  )
}
