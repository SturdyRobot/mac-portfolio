// ═══════════════════════════════════════════════════════════════════
//  SCOPE ENGINE — the rate card.
//  Pure data. Every number the estimator produces traces back to here,
//  so pricing is auditable and the LLM can never invent a figure.
// ═══════════════════════════════════════════════════════════════════

/** Blended hourly rate (USD) and realistic solo weekly billable capacity. */
export const RATE = 95
export const WEEKLY_CAPACITY = 25

/** How wide the quoted band is around the point estimate (± fraction). */
export const BAND = 0.12

/** Project archetypes — the base build (scaffolding, deploy, QA) in hours. */
export const PROJECT_TYPES = [
  { id: 'landing',    label: 'Landing / marketing site', icon: '🌐', base: 18, blurb: 'A polished single site to convert visitors.' },
  { id: 'webapp',     label: 'Web app (SaaS-style)',     icon: '🧩', base: 64, blurb: 'A real product with accounts and data.' },
  { id: 'aitool',     label: 'AI-powered tool',          icon: '🤖', base: 52, blurb: 'An LLM feature wired into a usable UI.' },
  { id: 'automation', label: 'Workflow automation',      icon: '⚙️', base: 40, blurb: 'Connect systems, remove manual steps.' },
  { id: 'ecommerce',  label: 'E-commerce store',         icon: '🛒', base: 58, blurb: 'Catalog, cart, checkout, the works.' },
  { id: 'game',       label: 'Browser game / interactive', icon: '🎮', base: 46, blurb: 'Something people actually want to play.' },
]

/** Optional feature modules — added effort in hours. */
export const FEATURES = [
  { id: 'auth',          label: 'User accounts & auth',        hours: 14 },
  { id: 'payments',      label: 'Payments (Stripe)',           hours: 18 },
  { id: 'dashboard',     label: 'Dashboard & analytics',       hours: 22 },
  { id: 'cms',           label: 'Content management',          hours: 16 },
  { id: 'ai',            label: 'AI / LLM features',           hours: 26 },
  { id: 'api',           label: 'Third-party API integration', hours: 12 },
  { id: 'realtime',      label: 'Realtime / live updates',     hours: 20 },
  { id: 'admin',         label: 'Admin panel',                 hours: 18 },
  { id: 'search',        label: 'Search & filtering',          hours: 12 },
  { id: 'notifications', label: 'Email / notifications',       hours: 10 },
  { id: 'multiuser',     label: 'Teams / multi-tenant',        hours: 24 },
  { id: 'i18n',          label: 'Multi-language',              hours: 12 },
]

/** Scale of the build — a multiplier on the whole estimate. */
export const SCALES = [
  { id: 'small',  label: 'Small', detail: 'a few screens', mult: 0.85 },
  { id: 'medium', label: 'Medium', detail: 'a full product', mult: 1.0 },
  { id: 'large',  label: 'Large', detail: 'many flows & edge cases', mult: 1.35 },
]

/** Design approach — a multiplier. */
export const DESIGNS = [
  { id: 'template', label: 'Clean & templated', detail: 'fast, proven patterns', mult: 0.9 },
  { id: 'custom',   label: 'Custom design',     detail: 'bespoke look & feel', mult: 1.15 },
  { id: 'system',   label: 'Full design system', detail: 'reusable, branded', mult: 1.3 },
]

/** Timeline preference — rush work carries a premium. */
export const TIMELINES = [
  { id: 'standard', label: 'Standard', detail: 'normal cadence', mult: 1.0 },
  { id: 'rush',     label: 'Rush', detail: 'front of the queue', mult: 1.35 },
]

/** Monthly maintenance retainer (hours/month) when opted in. */
export const RETAINER_HOURS = 8

/** Budget bands the visitor can share (no price is shown to them). */
export const BUDGETS = [
  { id: 'under5', label: 'Under $5k' },
  { id: '5to15', label: '$5k – $15k' },
  { id: '15to40', label: '$15k – $40k' },
  { id: 'over40', label: '$40k+' },
  { id: 'unsure', label: 'Not sure yet' },
]

/** Who the project is for — gates how deep the AI probes. */
export const PERSONAS = [
  { id: 'personal', label: 'Just me', icon: '🙋', blurb: 'A personal project or side idea.' },
  { id: 'business', label: 'A business', icon: '🏢', blurb: 'For a company or client.' },
]

/** Company size (business only) — `depth` = how many follow-up questions the AI asks. */
export const SIZES = [
  { id: 'solo', label: 'Solo / freelancer', detail: 'just you', depth: 2 },
  { id: 'small', label: 'Small team', detail: '2–20 people', depth: 3 },
  { id: 'mid', label: 'Mid-size', detail: '20–200 people', depth: 4 },
  { id: 'large', label: 'Large company', detail: '200+ people', depth: 5 },
]

/** What I'll need from the client — auto-derived from the features they pick. */
export const NEEDS_BY_FEATURE = {
  payments: 'A Stripe (or preferred processor) account',
  cms: 'Your content, copy, and any imagery',
  ai: 'Which LLM/provider you want (and an API key, or budget for one)',
  api: 'Docs/credentials for the third-party service to integrate',
  auth: 'Decision on sign-in methods (email, Google, SSO…)',
  notifications: 'A sending domain/service for email (or I set one up)',
  multiuser: 'Your team/roles model — who can do what',
  i18n: 'The list of languages and who provides translations',
}
/** Always needed, regardless of features. */
export const BASE_NEEDS = [
  'Brand assets — logo, colors, fonts (or a blank slate to design from)',
  'A primary point of contact for decisions & sign-off',
]

/** The delivery phases, with the share of the timeline each takes. */
export const PHASES = [
  { id: 'discovery', label: 'Discovery & scope', share: 0.12 },
  { id: 'design', label: 'Design & prototype', share: 0.23 },
  { id: 'build', label: 'Build', share: 0.4 },
  { id: 'qa', label: 'QA & polish', share: 0.15 },
  { id: 'launch', label: 'Launch & handoff', share: 0.1 },
]

/** When they need it done. */
export const DEADLINES = [
  { id: 'asap', label: 'As soon as possible' },
  { id: '1mo', label: 'Within a month' },
  { id: '1to3', label: '1–3 months' },
  { id: '3to6', label: '3–6 months' },
  { id: 'flex', label: 'Flexible / no rush' },
]

// ─── lookup helpers (kept tiny; no logic lives here) ───
const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]))
export const PROJECT_BY_ID = byId(PROJECT_TYPES)
export const FEATURE_BY_ID = byId(FEATURES)
export const SCALE_BY_ID = byId(SCALES)
export const DESIGN_BY_ID = byId(DESIGNS)
export const TIMELINE_BY_ID = byId(TIMELINES)
export const BUDGET_BY_ID = byId(BUDGETS)
export const BUDGET_IDS = BUDGETS.map((b) => b.id)
export const DEADLINE_BY_ID = byId(DEADLINES)
export const DEADLINE_IDS = DEADLINES.map((d) => d.id)
export const PERSONA_BY_ID = byId(PERSONAS)
export const PERSONA_IDS = PERSONAS.map((p) => p.id)
export const SIZE_BY_ID = byId(SIZES)
export const SIZE_IDS = SIZES.map((s) => s.id)

export const PROJECT_IDS = PROJECT_TYPES.map((p) => p.id)
export const FEATURE_IDS = FEATURES.map((f) => f.id)
export const SCALE_IDS = SCALES.map((s) => s.id)
export const DESIGN_IDS = DESIGNS.map((d) => d.id)
export const TIMELINE_IDS = TIMELINES.map((t) => t.id)
