// ═══════════════════════════════════════════════════════════════════
//  SCOPE ENGINE — schemas (the contracts).
//  Zod is the single source of truth for shape + validation:
//   • Intake  — validated before the engine runs (guards the UI).
//   • Scope   — validated on the way out (guards the PDF / summary).
//   • AiSummary — validates the LLM's reply, so a bad model response
//                 can never reach the document.
// ═══════════════════════════════════════════════════════════════════
import { z } from 'zod'
import { PROJECT_IDS, FEATURE_IDS, SCALE_IDS, DESIGN_IDS, TIMELINE_IDS } from './catalog.js'

// enums are derived from the catalog, so schema + rate card can't drift
export const ProjectType = z.enum(PROJECT_IDS)
export const FeatureId = z.enum(FEATURE_IDS)
export const Scale = z.enum(SCALE_IDS)
export const Design = z.enum(DESIGN_IDS)
export const Timeline = z.enum(TIMELINE_IDS)

export const Contact = z.object({
  name: z.string().trim().max(80).default(''),
  email: z.string().trim().email().or(z.literal('')).default(''),
  company: z.string().trim().max(120).default(''),
})

export const Intake = z.object({
  projectType: ProjectType,
  brief: z.string().trim().max(600).default(''),
  features: z.array(FeatureId).default([]),
  scale: Scale.default('medium'),
  design: Design.default('template'),
  timeline: Timeline.default('standard'),
  maintenance: z.boolean().default(false),
  contact: Contact.default({ name: '', email: '', company: '' }),
})

export const LineItem = z.object({
  id: z.string(),
  label: z.string(),
  hours: z.number().nonnegative(),
  cost: z.number().nonnegative(),
})

export const Range = z.object({
  low: z.number().nonnegative(),
  high: z.number().nonnegative(),
})

export const Scope = z.object({
  lineItems: z.array(LineItem).min(1),
  hours: z.number().positive(),
  subtotal: z.number().positive(),
  total: Range,
  weeks: Range,
  monthly: z.number().nonnegative().nullable(),
  assumptions: z.array(z.string()),
  summary: z.string(),
  summarySource: z.enum(['local', 'ai']),
  generatedAt: z.string(),
})

/** The shape the edge proxy must return; anything else is rejected. */
export const AiSummary = z.object({
  summary: z.string().trim().min(1).max(1200),
})
