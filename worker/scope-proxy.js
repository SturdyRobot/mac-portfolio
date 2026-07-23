// ═══════════════════════════════════════════════════════════════════
//  scope-proxy — Cloudflare Worker
//  The ONLY place the LLM API key lives. The static site never sees it.
//  Takes the (already-priced) scope, asks Groq for a nicer prose summary,
//  and returns { summary }. Hard per-IP rate limit + token cap so a
//  scraped endpoint can't run up a bill.
//
//  Setup: see worker/README.md
//    - Secret:  GROQ_API_KEY
//    - KV bind: SCOPE_KV        (per-IP rate counter)
//    - Vars:    ALLOW_ORIGIN, GROQ_MODEL, RATE_MAX  (optional)
// ═══════════════════════════════════════════════════════════════════

const DEFAULTS = {
  GROQ_MODEL: 'llama-3.3-70b-versatile',
  RATE_MAX: 5, // generations per IP per hour
  MAX_TOKENS: 500,
}

export default {
  async fetch(request, env) {
    // ALLOW_ORIGIN may be a comma-separated allowlist; echo whichever origin
    // matches (so both apex and www work), else fall back to the first entry.
    const allowlist = (env.ALLOW_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean)
    const reqOrigin = request.headers.get('Origin') || ''
    const origin = allowlist.length === 0 ? '*' : (allowlist.includes(reqOrigin) ? reqOrigin : allowlist[0])
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type',
      'Vary': 'Origin',
    }
    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', ...cors } })

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors })
    if (request.method !== 'POST') return json({ error: 'method' }, 405)

    // ── per-IP hourly rate limit ──
    const ip = request.headers.get('CF-Connecting-IP') || 'anon'
    const max = Number(env.RATE_MAX) || DEFAULTS.RATE_MAX
    const bucket = `rl:${ip}:${Math.floor(Date.now() / 3600000)}`
    if (env.SCOPE_KV) {
      const used = Number(await env.SCOPE_KV.get(bucket)) || 0
      if (used >= max) return json({ error: 'rate_limited' }, 429)
      await env.SCOPE_KV.put(bucket, String(used + 1), { expirationTtl: 3600 })
    }

    let body
    try { body = await request.json() } catch { return json({ error: 'bad_json' }, 400) }

    const facts = [
      `Project type: ${body.projectType}`,
      body.brief ? `What they said: ${String(body.brief).slice(0, 600)}` : '',
      body.features?.length ? `Features they want: ${body.features.join(', ')}` : '',
      `Scale: ${body.scale}`,
      body.budget ? `Budget band: ${body.budget}` : '',
      body.deadline ? `Timing: ${body.deadline}` : '',
    ].filter(Boolean).join('\n')

    const messages = [
      {
        role: 'system',
        content:
          'You are a senior freelance software developer triaging a new project inquiry from an intake form. ' +
          'Return a JSON object with two keys:\n' +
          '• "summary": a warm, plain 2–3 sentence recap of what they want built, in the developer\'s voice ' +
          '(first person is fine). No marketing hype, no headings. You MUST NOT mention, quote, or invent any price or cost.\n' +
          '• "questions": an array of 2–3 sharp, specific follow-up questions THIS project would need answered before ' +
          'it could be scoped — the kind a senior dev asks to de-risk the work. Tailor them to what they said; avoid ' +
          'generic filler. Never ask about budget or price (already collected). Keep each under 140 characters.',
      },
      { role: 'user', content: facts },
    ]

    const key = env.GROQ_API_KEY
    if (!key) return json({ error: 'unconfigured' }, 500)

    let r
    try {
      r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: env.GROQ_MODEL || DEFAULTS.GROQ_MODEL,
          messages,
          temperature: 0.5,
          max_tokens: DEFAULTS.MAX_TOKENS,
          response_format: { type: 'json_object' },
        }),
      })
    } catch {
      return json({ error: 'upstream' }, 502)
    }
    if (!r.ok) return json({ error: 'upstream', status: r.status }, 502)

    const data = await r.json()
    const raw = data?.choices?.[0]?.message?.content
    if (!raw) return json({ error: 'empty' }, 502)

    let parsed
    try { parsed = JSON.parse(raw) } catch { return json({ error: 'bad_model_json' }, 502) }
    const summary = String(parsed.summary || '').trim().slice(0, 1200)
    if (!summary) return json({ error: 'empty' }, 502)
    const questions = Array.isArray(parsed.questions)
      ? parsed.questions.map((q) => String(q).trim().slice(0, 240)).filter(Boolean).slice(0, 3)
      : []

    return json({ summary, questions })
  },
}
