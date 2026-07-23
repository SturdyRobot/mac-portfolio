// ═══════════════════════════════════════════════════════════════════
//  INTAKE — lead submission.
//  buildLead() turns the intake + brief into a human-readable payload
//  (labels, not ids). submitLead() POSTs it to the edge proxy, which
//  forwards it to Noel's Discord. If the proxy is unconfigured or down,
//  it falls back to opening the visitor's mail client — a lead never
//  gets lost.
// ═══════════════════════════════════════════════════════════════════
import { SCOPE_PROXY } from './config.js'
import {
  PROJECT_BY_ID, FEATURE_BY_ID, BUDGET_BY_ID, DEADLINE_BY_ID, SIZE_BY_ID,
} from './catalog.js'

/** Build a display-ready lead (labels resolved) for Discord / email. */
export function buildLead(intake, brief, answers = {}) {
  const qa = (brief.questions || [])
    .map((q, i) => ({ q, a: String(answers[i] || '').trim() }))
    .filter((x) => x.a)
  return {
    projectType: PROJECT_BY_ID[intake.projectType]?.label || intake.projectType,
    persona: intake.persona,
    size: intake.size ? (SIZE_BY_ID[intake.size]?.label || intake.size) : '',
    summary: brief.summary,
    features: intake.features.map((id) => FEATURE_BY_ID[id]?.label || id),
    budget: intake.budget ? (BUDGET_BY_ID[intake.budget]?.label || intake.budget) : '',
    deadline: intake.deadline ? (DEADLINE_BY_ID[intake.deadline]?.label || intake.deadline) : '',
    needs: brief.needs || [],
    schedule: brief.schedule || [],
    qa,
    notes: intake.brief || '',
    contact: intake.contact,
  }
}

/**
 * Deliver a lead. Returns 'sent' if it reached Discord, or 'mailto' if it
 * fell back to the mail client.
 * @returns {Promise<'sent' | 'mailto'>}
 */
export async function submitLead(lead, mailtoUrl, { timeoutMs = 10000 } = {}) {
  if (SCOPE_PROXY) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(SCOPE_PROXY, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'submit', lead }),
        signal: controller.signal,
      })
      if (res.ok) return 'sent'
    } catch {
      /* fall through to mailto */
    } finally {
      clearTimeout(timer)
    }
  }
  if (typeof window !== 'undefined' && mailtoUrl) window.location.href = mailtoUrl
  return 'mailto'
}
