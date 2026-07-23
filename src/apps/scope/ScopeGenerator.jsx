import { useMemo, useState } from 'react'
import './scope.css'
import { PROJECT_TYPES, FEATURES, SCALES, DESIGNS, TIMELINES } from './catalog.js'
import { buildScope, money, duration } from './pricing.js'
import { polishSummary } from './summarize.js'
import { downloadQuote } from './pdf.js'
import { SCOPE_PROXY } from './config.js'

const EMPTY = {
  projectType: '',
  brief: '',
  features: [],
  scale: 'medium',
  design: 'template',
  timeline: 'standard',
  maintenance: false,
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

  // live, deterministic estimate — recomputed on every change
  const live = useMemo(() => {
    if (!intake.projectType) return null
    try { return buildScope(intake) } catch { return null }
  }, [intake])

  function generate() {
    const scope = buildScope(intake)
    setResult({ scope, polishing: !!SCOPE_PROXY })
    if (SCOPE_PROXY) {
      polishSummary(intake, scope).then(({ summary, source }) =>
        setResult((r) => (r ? { ...r, scope: { ...r.scope, summary, summarySource: source }, polishing: false } : r)),
      )
    }
  }

  const reset = () => { setIntake(EMPTY); setResult(null); setStep(0) }

  if (result) return <Result intake={intake} scope={result.scope} polishing={result.polishing} onReset={reset} />

  const canNext = step !== 0 || !!intake.projectType
  const last = step === STEPS.length - 1

  return (
    <div className="sg">
      <header className="sg-head">
        <div className="sg-brand"><span className="sg-logo">💼</span> Scope a Project</div>
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
              placeholder="Anything specific? (optional — a sentence or two about the goal)"
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
            <Segment label="Timeline" options={TIMELINES} value={intake.timeline} onPick={(id) => set({ timeline: id })} />
            <label className="sg-toggle">
              <input
                type="checkbox"
                checked={intake.maintenance}
                onChange={(e) => set({ maintenance: e.target.checked })}
              />
              <span>Include an ongoing maintenance retainer</span>
            </label>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="sg-q">Where should I send it?</h2>
            <p className="sg-sub">Optional — but if you leave an email I can follow up with the real thing.</p>
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
          {live ? (
            <><b>{money(live.total)}</b><span className="sg-est-sep">·</span><span>{duration(live.weeks)}</span></>
          ) : (
            <span className="sg-muted">Pick a project for a live estimate</span>
          )}
        </div>
        <div className="sg-nav">
          {step > 0 && <button className="sg-btn ghost" onClick={() => setStep(step - 1)}>Back</button>}
          {!last && <button className="sg-btn" disabled={!canNext} onClick={() => setStep(step + 1)}>Next</button>}
          {last && <button className="sg-btn primary" onClick={generate}>Get my estimate →</button>}
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

function Result({ intake, scope, polishing, onReset }) {
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const usd = (n) => `$${Math.round(n).toLocaleString('en-US')}`

  const asText =
    `Project scope — ${money(scope.total)} over ${duration(scope.weeks)}\n\n` +
    scope.summary + '\n\n' +
    scope.lineItems.map((l) => `• ${l.label} — ${l.hours}h — ${usd(l.cost)}`).join('\n')

  const mailto =
    `mailto:noeljacksonjs@gmail.com?subject=${encodeURIComponent('Project inquiry — ' + money(scope.total))}` +
    `&body=${encodeURIComponent(asText + '\n\n— sent from the Scope tool on sturdyrobot.io')}`

  async function pdf() {
    setBusy(true)
    try { await downloadQuote(scope, intake) } finally { setBusy(false) }
  }
  function copy() {
    navigator.clipboard?.writeText(asText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600) })
  }

  return (
    <div className="sg sg-result">
      <header className="sg-head">
        <div className="sg-brand"><span className="sg-logo">💼</span> Your estimate</div>
        <span className={`sg-badge ${scope.summarySource === 'ai' ? 'ai' : ''}`}>
          {polishing ? 'polishing…' : scope.summarySource === 'ai' ? 'AI-polished' : 'deterministic'}
        </span>
      </header>

      <div className="sg-body">
        <div className="sg-headline">
          <div>
            <div className="sg-headline-num">{money(scope.total)}</div>
            <div className="sg-headline-sub">estimated investment</div>
          </div>
          <div className="sg-headline-r">
            <div className="sg-headline-num">{duration(scope.weeks)}</div>
            <div className="sg-headline-sub">timeline</div>
          </div>
        </div>

        <p className="sg-summary">{scope.summary}</p>

        <div className="sg-lines">
          {scope.lineItems.map((l) => (
            <div className="sg-line" key={l.id}>
              <span className="sg-line-label">{l.label}</span>
              <span className="sg-line-hours">{l.hours}h</span>
              <span className="sg-line-cost">{usd(l.cost)}</span>
            </div>
          ))}
          {scope.monthly ? (
            <div className="sg-line sg-line-retainer">
              <span className="sg-line-label">Maintenance retainer</span>
              <span className="sg-line-hours" />
              <span className="sg-line-cost">{usd(scope.monthly)}/mo</span>
            </div>
          ) : null}
        </div>

        <details className="sg-assume">
          <summary>Assumptions</summary>
          <ul>{scope.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
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
