// ═══════════════════════════════════════════════════════════════════
//  SCOPE ENGINE — the (optional) AI polish layer.
//  Sends the *validated* scope to the edge proxy for a nicer prose
//  summary. The response is re-validated with Zod, so a bad model reply
//  can't reach the document. On ANY failure it returns the deterministic
//  summary — the tool never depends on the network to work.
// ═══════════════════════════════════════════════════════════════════
import { AiSummary } from './schema.js'
import { SCOPE_PROXY } from './config.js'

/**
 * @param {import('zod').infer<typeof import('./schema.js').Intake>} intake
 * @param {import('zod').infer<typeof import('./schema.js').Scope>} scope
 * @returns {Promise<{ summary: string, source: 'local' | 'ai' }>}
 */
export async function polishSummary(intake, scope, { timeoutMs = 8000 } = {}) {
  const fallback = { summary: scope.summary, source: /** @type {'local'} */ ('local') }
  if (!SCOPE_PROXY) return fallback

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(SCOPE_PROXY, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // send only what the prose needs — never the pricing math itself
      body: JSON.stringify({
        projectType: intake.projectType,
        brief: intake.brief,
        features: intake.features,
        scale: intake.scale,
        timeline: intake.timeline,
        total: scope.total,
        weeks: scope.weeks,
      }),
      signal: controller.signal,
    })
    if (!res.ok) return fallback
    const parsed = AiSummary.safeParse(await res.json())
    return parsed.success
      ? { summary: parsed.data.summary, source: /** @type {'ai'} */ ('ai') }
      : fallback
  } catch {
    return fallback
  } finally {
    clearTimeout(timer)
  }
}
