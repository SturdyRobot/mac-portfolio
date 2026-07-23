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
  MAX_TOKENS: 350,
}

export default {
  async fetch(request, env) {
    const origin = env.ALLOW_ORIGIN || '*'
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type',
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

    const money = (r) => (r ? `$${r.low?.toLocaleString?.() ?? r.low} – $${r.high?.toLocaleString?.() ?? r.high}` : 'n/a')
    const facts = [
      `Project type: ${body.projectType}`,
      body.brief ? `Client brief: ${String(body.brief).slice(0, 600)}` : '',
      body.features?.length ? `Features: ${body.features.join(', ')}` : '',
      `Scale: ${body.scale}`,
      `Timeline preference: ${body.timeline}`,
      `Quoted price (FIXED — do not change): ${money(body.total)}`,
      `Quoted timeline (FIXED — do not change): ${body.weeks?.low}-${body.weeks?.high} weeks`,
    ].filter(Boolean).join('\n')

    const messages = [
      {
        role: 'system',
        content:
          'You write the opening summary for a freelance software project quote. ' +
          'Two to three sentences, confident and plain — no marketing hype, no bullet points, no headings. ' +
          'You MUST NOT mention, alter, or invent any price or timeline other than the fixed figures given. ' +
          'Write in the voice of the developer (first person is fine).',
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
          temperature: 0.4,
          max_tokens: DEFAULTS.MAX_TOKENS,
        }),
      })
    } catch {
      return json({ error: 'upstream' }, 502)
    }
    if (!r.ok) return json({ error: 'upstream', status: r.status }, 502)

    const data = await r.json()
    const summary = data?.choices?.[0]?.message?.content?.trim()
    if (!summary) return json({ error: 'empty' }, 502)

    return json({ summary: summary.slice(0, 1200) })
  },
}
