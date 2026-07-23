// ═══════════════════════════════════════════════════════════════════
//  PROJECT BRIEF — the builder (pure).
//  intake → validated Brief. No network, no price, no invented timeline.
//  Deterministic: same intake always yields the same brief.
// ═══════════════════════════════════════════════════════════════════
import { PROJECT_BY_ID, FEATURE_BY_ID, SCALE_BY_ID } from './catalog.js'
import { Intake, Brief } from './schema.js'

// A friendly, deterministic recap of the project. Never mentions price.
function localSummary(intake) {
  const project = PROJECT_BY_ID[intake.projectType]
  const scale = SCALE_BY_ID[intake.scale]
  const feats = intake.features.map((id) => FEATURE_BY_ID[id].label.toLowerCase())
  const featText =
    feats.length === 0 ? 'a focused feature set'
    : feats.length === 1 ? feats[0]
    : `${feats.slice(0, -1).join(', ')} and ${feats[feats.length - 1]}`
  return (
    `A ${scale.label.toLowerCase()} ${project.label.toLowerCase()} covering ${featText}. ` +
    `Here's what I understand you're after — let's talk specifics.`
  )
}

const ASSUMPTIONS = [
  'Fixed scope as described; new requests are handled as a change order.',
  'Client provides copy, brand assets, and any required accounts/API keys.',
  'One round of revisions per milestone, with a working preview at each stage.',
]

/**
 * Build a validated Brief from raw intake.
 * @param {unknown} rawIntake
 * @returns {import('zod').infer<typeof Brief>}
 */
export function buildBrief(rawIntake) {
  const intake = Intake.parse(rawIntake) // guard the input
  const project = PROJECT_BY_ID[intake.projectType]

  const lineItems = [
    { id: 'base', label: `${project.label} — foundation, build & QA` },
    ...intake.features.map((id) => {
      const f = FEATURE_BY_ID[id]
      return { id: f.id, label: f.label }
    }),
  ]

  const brief = {
    lineItems,
    summary: localSummary(intake),
    summarySource: /** @type {'local'} */ ('local'),
    questions: /** @type {string[]} */ ([]), // filled by the AI layer when available
    budget: intake.budget,
    deadline: intake.deadline,
    assumptions: ASSUMPTIONS,
    generatedAt: new Date().toISOString(),
  }
  return Brief.parse(brief) // guard the output
}
