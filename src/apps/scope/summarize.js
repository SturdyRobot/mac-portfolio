// ═══════════════════════════════════════════════════════════════════
//  INTAKE — the (optional) AI layer.
//  Sends the *validated* intake to the edge proxy and gets back a warmer
//  summary AND 2–3 tailored follow-up questions. The reply is re-validated
//  with Zod, so a bad model response can't reach the document. On ANY
//  failure it returns the deterministic summary with no questions — the
//  tool never depends on the network to work.
// ═══════════════════════════════════════════════════════════════════
import { AiReply } from './schema.js'
import { SCOPE_PROXY } from './config.js'
import { SIZE_BY_ID } from './catalog.js'

// personal → 2 questions; business scales with company size.
function questionDepth(intake) {
  if (intake.persona !== 'business') return 2
  return intake.size && SIZE_BY_ID[intake.size] ? SIZE_BY_ID[intake.size].depth : 3
}

/**
 * @param {import('zod').infer<typeof import('./schema.js').Intake>} intake
 * @param {import('zod').infer<typeof import('./schema.js').Brief>} brief
 * @returns {Promise<{ summary: string, questions: string[], source: 'local' | 'ai' }>}
 */
export async function polishSummary(intake, brief, { timeoutMs = 12000 } = {}) {
  const fallback = { summary: brief.summary, questions: [], source: /** @type {'local'} */ ('local') }
  if (!SCOPE_PROXY) return fallback

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(SCOPE_PROXY, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // just the project facts — no price is involved anywhere
      body: JSON.stringify({
        persona: intake.persona,
        size: intake.size,
        questionCount: questionDepth(intake),
        projectType: intake.projectType,
        brief: intake.brief,
        features: intake.features,
        scale: intake.scale,
        budget: intake.budget,
        deadline: intake.deadline,
      }),
      signal: controller.signal,
    })
    if (!res.ok) return fallback
    const parsed = AiReply.safeParse(await res.json())
    return parsed.success
      ? { summary: parsed.data.summary, questions: parsed.data.questions, source: /** @type {'ai'} */ ('ai') }
      : fallback
  } catch {
    return fallback
  } finally {
    clearTimeout(timer)
  }
}
