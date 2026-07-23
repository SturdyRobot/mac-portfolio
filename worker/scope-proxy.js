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
  MAX_TOKENS: 800, // room for up to ~8 tailored questions + summary
}

// ── internal estimate (Noel-only; computed here so the client never sees it) ──
// Placeholder numbers — adjust to your real rates. Rate varies by build type.
const HOURS_BASE = { landing: 18, webapp: 64, rag: 48, extractor: 40, aitool: 52, automation: 40, localai: 50, game: 46 }
const FEATURE_HOURS = { auth: 14, payments: 18, dashboard: 22, cms: 16, ai: 26, api: 12, realtime: 20, admin: 18, search: 12, notifications: 10, multiuser: 24, i18n: 12 }
const SCALE_MULT = { small: 0.85, medium: 1.0, large: 1.35 }
// rate varies by what's being built — AI / compliance work commands more ($/hr)
const RATE_BY_TYPE = { landing: 95, webapp: 120, rag: 150, extractor: 135, aitool: 150, automation: 110, localai: 160, game: 120 }
const TIER_MULT = { indie: 0.9, startup: 1.0, mid_market: 1.25, enterprise: 1.5 }
const PUBLIC_EMAIL = new Set(['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'me.com', 'proton.me', 'protonmail.com', 'aol.com', 'live.com'])

function detectTier(raw) {
  if (!raw || raw.persona !== 'business') return { tier: 'indie', why: 'personal project' }
  const bySize = { solo: 'indie', small: 'startup', mid: 'mid_market', large: 'enterprise' }
  let tier = bySize[raw.size] || 'startup'
  const domain = (String(raw.email || '').split('@')[1] || '').toLowerCase()
  const why = []
  if (domain && !PUBLIC_EMAIL.has(domain)) why.push(`corporate domain @${domain}`)
  if (domain && PUBLIC_EMAIL.has(domain)) { why.push(`personal email @${domain}`); if (tier === 'enterprise') tier = 'mid_market' } // guard vs false-enterprise
  why.push(`self-reported: ${raw.size || 'unspecified'}`)
  return { tier, why: why.join(' · ') }
}

function computeEstimate(raw) {
  if (!raw || !HOURS_BASE[raw.projectType]) return null
  const featureHours = (raw.features || []).reduce((s, id) => s + (FEATURE_HOURS[id] || 0), 0)
  const hours = Math.round((HOURS_BASE[raw.projectType] + featureHours) * (SCALE_MULT[raw.scale] || 1))
  const { tier, why } = detectTier(raw)
  const rate = RATE_BY_TYPE[raw.projectType] || 120
  const point = hours * rate * (TIER_MULT[tier] || 1)
  const round = (n) => Math.round(n / 250) * 250
  const usd = (n) => `$${n.toLocaleString('en-US')}`
  return {
    tier, why,
    range: `${usd(round(point * 0.88))} – ${usd(round(point * 1.15))}`,
    detail: `~${hours}h · ${raw.projectType} @ $${rate}/h · ${tier} ×${TIER_MULT[tier]}`,
  }
}

// Format a submitted lead as a rich Discord embed. Robust to missing fields.
function discordPayload(lead) {
  const est = computeEstimate(lead.raw)
  const trunc = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s }
  const who = [lead.contact?.name, lead.contact?.company].filter(Boolean).join(' · ') || 'Someone'
  const persona = lead.persona === 'business' ? `Business${lead.size ? ` · ${lead.size}` : ''}` : 'Personal'
  const fields = [
    { name: 'From', value: trunc(`${who}\n${lead.contact?.email || 'no email given'}`, 1024) },
    { name: 'For', value: trunc(persona, 1024), inline: true },
    { name: 'Budget', value: trunc(lead.budget || '—', 1024), inline: true },
    { name: 'Timeline', value: trunc(lead.deadline || '—', 1024), inline: true },
    { name: 'Wants', value: trunc((lead.features || []).join(', ') || 'core build only', 1024) },
    { name: "They'll need to provide", value: trunc((lead.needs || []).map((x) => `• ${x}`).join('\n') || '—', 1024) },
    { name: 'Suggested schedule', value: trunc((lead.schedule || []).map((p) => `• ${p.label} — ${p.weeks}`).join('\n') || '—', 1024) },
  ]
  if (lead.qa?.length) fields.push({ name: 'Follow-up answers', value: trunc(lead.qa.map((x) => `**${x.q}**\n${x.a}`).join('\n\n'), 1024) })
  if (lead.notes) fields.push({ name: 'Their notes', value: trunc(lead.notes, 1024) })
  if (est) fields.unshift({ name: `💰 Internal estimate — ${est.tier}`, value: trunc(`**${est.range}**\n${est.detail}\n_tier: ${est.why}_`, 1024) })
  return {
    content: `📥 **New project lead** — ${trunc(lead.projectType || 'project', 60)}`,
    embeds: [{
      title: trunc(`${who} · ${persona}`, 256),
      description: trunc(lead.summary || '', 2048),
      color: 0x2f81f7,
      fields,
    }],
  }
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

    // ── lead submission → Discord (no LLM involved) ──
    if (body.action === 'submit') {
      const hook = env.DISCORD_WEBHOOK
      if (!hook) return json({ error: 'no_webhook' }, 503)
      try {
        const r = await fetch(hook, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(discordPayload(body.lead || {})),
        })
        return r.ok ? json({ ok: true }) : json({ error: 'discord', status: r.status }, 502)
      } catch { return json({ error: 'discord' }, 502) }
    }

    // ── otherwise: generate the summary + tailored questions ──
    // The AI decides how many questions the project actually needs, within a
    // range that widens with company size.
    const rangeBySize = { '': [3, 5], solo: [2, 4], small: [3, 5], mid: [4, 6], large: [5, 8] }
    const [qLo, qHi] = body.persona === 'business' ? (rangeBySize[body.size || ''] || [3, 5]) : [2, 4]
    const persona = body.persona === 'business'
      ? `a business${body.size ? ` (${body.size})` : ''}` : 'a personal project'
    const facts = [
      `This is for: ${persona}`,
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
          '• "questions": the follow-up questions THIS specific project genuinely needs answered before it could be ' +
          `scoped — ask as many as it actually takes to de-risk it (aim for ${qLo}–${qHi}; use the high end for complex ` +
          'or enterprise builds, fewer only if it is genuinely simple). Tailor to what they said; no generic filler. ' +
          'For larger organisations probe stakeholders, existing systems/integrations, compliance, procurement, scale. ' +
          'Never ask about budget or price (already collected). Keep each under 140 characters.',
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
      ? parsed.questions.map((q) => String(q).trim().slice(0, 240)).filter(Boolean).slice(0, qHi)
      : []

    return json({ summary, questions })
  },
}
