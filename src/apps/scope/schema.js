// ═══════════════════════════════════════════════════════════════════
//  PROJECT BRIEF — schemas (the contracts).
//  A lead-capture form: it collects what the visitor wants, their
//  budget, and their timing — and hands it over as a structured brief.
//  No price is ever shown. Zod is the single source of truth for shape:
//   • Intake — validated before a brief is built (guards the UI).
//   • Brief  — validated on the way out (guards the PDF / summary).
//   • AiSummary — validates the LLM's reply so a bad response can't
//                 reach the document.
// ═══════════════════════════════════════════════════════════════════
import { z } from 'zod'
import {
  PROJECT_IDS, FEATURE_IDS, SCALE_IDS, DESIGN_IDS, BUDGET_IDS, DEADLINE_IDS,
  PERSONA_IDS, SIZE_IDS,
} from './catalog.js'

// enums are derived from the catalog, so schema + catalog can't drift
export const ProjectType = z.enum(PROJECT_IDS)
export const FeatureId = z.enum(FEATURE_IDS)
export const Scale = z.enum(SCALE_IDS)
export const Design = z.enum(DESIGN_IDS)
export const Budget = z.enum(BUDGET_IDS).or(z.literal('')) // optional — '' = not shared
export const Deadline = z.enum(DEADLINE_IDS).or(z.literal(''))
export const Persona = z.enum(PERSONA_IDS)
export const Size = z.enum(SIZE_IDS).or(z.literal('')) // business only

export const Contact = z.object({
  name: z.string().trim().max(80).default(''),
  email: z.string().trim().email().or(z.literal('')).default(''),
  company: z.string().trim().max(120).default(''),
})

export const Intake = z.object({
  persona: Persona.default('personal'),
  size: Size.default(''),
  projectType: ProjectType,
  brief: z.string().trim().max(600).default(''),
  features: z.array(FeatureId).default([]),
  scale: Scale.default('medium'),
  design: Design.default('template'),
  budget: Budget.default(''),
  deadline: Deadline.default(''),
  contact: Contact.default({ name: '', email: '', company: '' }),
})

export const LineItem = z.object({
  id: z.string(),
  label: z.string(),
})

export const Phase = z.object({
  label: z.string(),
  weeks: z.string(), // human range like "1–2 wks"
})

export const Brief = z.object({
  lineItems: z.array(LineItem).min(1), // "what's typically involved" — no hours, no price
  summary: z.string(),
  summarySource: z.enum(['local', 'ai']),
  questions: z.array(z.string()).default([]), // AI-generated follow-ups (empty without the LLM)
  needs: z.array(z.string()).default([]),     // what I'll need from the client (client-facing)
  schedule: z.array(Phase).default([]),       // delivery phases (internal — for Noel)
  budget: Budget,     // echoed back from intake, for the PDF / email
  deadline: Deadline,
  assumptions: z.array(z.string()),
  generatedAt: z.string(),
})

/** The shape the edge proxy must return; anything else is rejected. */
export const AiReply = z.object({
  summary: z.string().trim().min(1).max(1200),
  questions: z.array(z.string().trim().min(1).max(240)).max(8).default([]),
})
