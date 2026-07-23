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

Prereqs: a free Cloudflare account, a free [Groq API key](https://console.groq.com), and `npx wrangler`.

```sh
# 1. from this folder
npx wrangler deploy scope-proxy.js --name scope-proxy --compatibility-date 2024-11-01

# 2. add the key as a secret (never a plain var)
npx wrangler secret put GROQ_API_KEY --name scope-proxy

# 3. create + bind a KV namespace for the rate counter
npx wrangler kv namespace create SCOPE_KV
#    then add the binding shown to the worker (dashboard → Settings → Variables → KV)
```

Optional plain vars (dashboard → Settings → Variables):

| Var | Default | Purpose |
|-----|---------|---------|
| `ALLOW_ORIGIN` | `*` | lock CORS to `https://sturdyrobot.io` |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | any Groq chat model |
| `RATE_MAX` | `5` | generations per IP per hour |

## Wire it to the site

Set the Worker URL at build time and rebuild:

```sh
VITE_SCOPE_PROXY="https://scope-proxy.<you>.workers.dev" npm run build
```

With it unset, the tool runs offline with the deterministic summary. With it set,
the result screen switches from the `deterministic` badge to `AI-polished`.
