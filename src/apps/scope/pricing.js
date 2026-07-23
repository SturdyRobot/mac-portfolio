// ═══════════════════════════════════════════════════════════════════
//  SCOPE ENGINE — the estimator (pure).
//  intake → validated Scope. No network, no dates-from-outside, no LLM.
//  Deterministic: same intake always yields the same quote, which is
//  what makes the number defensible.
// ═══════════════════════════════════════════════════════════════════
import {
  RATE, WEEKLY_CAPACITY, BAND, RETAINER_HOURS,
  PROJECT_BY_ID, FEATURE_BY_ID, SCALE_BY_ID, DESIGN_BY_ID, TIMELINE_BY_ID,
} from './catalog.js'
import { Intake, Scope } from './schema.js'

const round50 = (n) => Math.round(n / 50) * 50
const usd = (n) => `$${Math.round(n).toLocaleString('en-US')}`

/** Human-readable price range, e.g. "$8,400 – $10,600". */
export function money(range) {
  return `${usd(range.low)} – ${usd(range.high)}`
}

/** Human-readable timeline, e.g. "5–7 weeks". */
export function duration(range) {
  return range.low === range.high ? `${range.low} weeks` : `${range.low}–${range.high} weeks`
}

// A professional, deterministic summary. This is the baseline the tool
// ships with; the LLM layer may replace it, but never the numbers.
function localSummary(intake, lineItems, total, weeks) {
  const project = PROJECT_BY_ID[intake.projectType]
  const scale = SCALE_BY_ID[intake.scale]
  const feats = intake.features.map((id) => FEATURE_BY_ID[id].label.toLowerCase())
  const featText =
    feats.length === 0 ? 'a focused feature set'
    : feats.length === 1 ? feats[0]
    : `${feats.slice(0, -1).join(', ')} and ${feats[feats.length - 1]}`
  const rush = intake.timeline === 'rush' ? ' on an accelerated timeline' : ''
  return (
    `A ${scale.label.toLowerCase()} ${project.label.toLowerCase()} covering ${featText}. ` +
    `Scoped across ${lineItems.length} work items at an estimated ${money(total)} over ${duration(weeks)}${rush}. ` +
    `Fixed scope, milestone-based delivery, and a working preview at every stage.`
  )
}

function assumptionsFor(intake) {
  const a = [
    'Fixed scope as itemized; new requests are quoted as a change order.',
    'Client provides copy, brand assets, and any required accounts/API keys.',
    'One round of revisions per milestone.',
    'Estimate assumes modern hosting (Vercel/Cloudflare/similar).',
  ]
  if (intake.timeline === 'rush') a.push('Rush pricing reflects reprioritised scheduling.')
  if (intake.features.includes('ai')) a.push('LLM usage billed at cost, or brought via your own API key.')
  if (intake.features.includes('payments')) a.push('Payment provider (Stripe) account and fees are the client’s.')
  return a
}

/**
 * Build a validated Scope from raw intake.
 * @param {unknown} rawIntake
 * @returns {import('zod').infer<typeof Scope>}
 */
export function buildScope(rawIntake) {
  const intake = Intake.parse(rawIntake) // guard the input

  const project = PROJECT_BY_ID[intake.projectType]
  const mult =
    SCALE_BY_ID[intake.scale].mult *
    DESIGN_BY_ID[intake.design].mult *
    TIMELINE_BY_ID[intake.timeline].mult

  const raw = [
    { id: 'base', label: `${project.label} — foundation, build & QA`, hours: project.base },
    ...intake.features.map((id) => {
      const f = FEATURE_BY_ID[id]
      return { id: f.id, label: f.label, hours: f.hours }
    }),
  ]

  const lineItems = raw.map((l) => {
    const hours = Math.max(1, Math.round(l.hours * mult))
    return { id: l.id, label: l.label, hours, cost: hours * RATE }
  })

  const hours = lineItems.reduce((s, l) => s + l.hours, 0)
  const subtotal = lineItems.reduce((s, l) => s + l.cost, 0)
  const total = { low: round50(subtotal * (1 - BAND)), high: round50(subtotal * (1 + BAND)) }

  const pointWeeks = Math.max(1, Math.round(hours / WEEKLY_CAPACITY))
  const weeks = { low: pointWeeks, high: pointWeeks + Math.max(1, Math.round(pointWeeks * 0.4)) }

  const monthly = intake.maintenance ? RETAINER_HOURS * RATE : null

  const scope = {
    lineItems,
    hours,
    subtotal,
    total,
    weeks,
    monthly,
    assumptions: assumptionsFor(intake),
    summary: localSummary(intake, lineItems, total, weeks),
    summarySource: /** @type {'local'} */ ('local'),
    generatedAt: new Date().toISOString(),
  }

  return Scope.parse(scope) // guard the output
}
