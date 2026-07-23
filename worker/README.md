# scope-proxy — edge LLM proxy

A tiny Cloudflare Worker that lets the static site show AI-polished quote
summaries **without ever exposing an API key**. It injects a Groq key server-side,
rate-limits by IP, and caps output tokens — so a scraped endpoint can't run up a bill.

The portfolio works **without this** (the Scope tool ships a deterministic summary).
This only upgrades the prose. It's progressive enhancement, not a dependency.

## What it does

```
sturdyrobot.io  ──POST scope──▶  scope-proxy (Worker)  ──key──▶  Groq (Llama 3.3 70B)
   (no key)                      · per-IP rate limit
                                 · token cap
                                 ◀── { summary } ──
```

The client sends only the intake + the **already-computed** price/timeline. The
Worker is told those figures are fixed, so the model can never change the numbers —
it only writes the sentence around them. The reply is re-validated (Zod) on the
client before it's shown.

## Deploy (~5 min)

Config lives in `wrangler.toml`, so these are the only commands — run them **from
this `worker/` folder**. Prereqs: a free Cloudflare account, a free
[Groq API key](https://console.groq.com), and `npx wrangler`.

```sh
# 1. sign in to your Cloudflare account (opens a browser)
npx wrangler login

# 2. (recommended) create the rate-limit store, then paste the printed id into
#    wrangler.toml under [[kv_namespaces]] and uncomment that block
npx wrangler kv namespace create SCOPE_KV

# 3. add your Groq key as a secret — never a plain var, never committed
npx wrangler secret put GROQ_API_KEY

# 4. ship it
npx wrangler deploy
```

Tunables already set in `wrangler.toml` (edit there): `ALLOW_ORIGIN` (locks CORS
to your domain), `GROQ_MODEL`, and `RATE_MAX` (generations per IP per hour).

## Wire it to the site

Set the Worker URL at build time and rebuild:

```sh
VITE_SCOPE_PROXY="https://scope-proxy.<you>.workers.dev" npm run build
```

With it unset, the tool runs offline with the deterministic summary. With it set,
the result screen switches from the `deterministic` badge to `AI-polished`.
