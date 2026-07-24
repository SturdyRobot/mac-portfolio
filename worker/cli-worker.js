// ═══════════════════════════════════════════════════════════════════
//  cli.nlj.dev — the curl-able terminal endpoint (Cloudflare Worker)
//
//  A systems engineer who runs `curl -sL cli.nlj.dev` gets a clean ASCII
//  résumé + system status instead of HTML. Browsers are redirected to the
//  real site. Routes:
//    /            ASCII home (résumé + status + commands)
//    /resume      plaintext résumé
//    /kedge       kedge architecture spec
//    /keys        real SSH + GPG public keys (proxied from GitHub)
//  Deploy: see worker/README-cli.md
// ═══════════════════════════════════════════════════════════════════

const CT = { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300' }
const isCli = (ua) => /\b(curl|wget|httpie|libcurl|powershell|python-requests|got|fetch)\b/i.test(ua || '')

const HOME = `
NOEL JACKSON III  ──►  Systems & AI Infrastructure Engineer
domain: nlj.dev   contact: noel@nlj.dev   github: @nlj3

  Deterministic Rust runtimes · WASM execution engines · low-level AI infra.

[ SYSTEMS & RUNTIMES ]
  kedge (kedge-rt)  ──►  deterministic WASM/Rust AI-agent harness · 15 crates
  kedge-compact     ──►  Tree-sitter AST compactor (73,942 tokens saved, measured)
  worldframe        ──►  shipped Tauri + Rust desktop app · tryworldframe.com

[ STATUS ]
  ledger      deterministic · replay-verified
  compaction  58.7% context reduction (measured)
  shadow-guard  fail-safe tool interception : active

[ COMMANDS ]
  curl cli.nlj.dev/resume    print the plaintext résumé
  curl cli.nlj.dev/kedge     fetch the kedge architecture spec
  curl cli.nlj.dev/keys      fetch public SSH + GPG keys

  or just open  https://nlj.dev
`

const RESUME = `
NOEL JACKSON III
Systems & AI Infrastructure Engineer
noel@nlj.dev · nlj.dev · github.com/nlj3

SUMMARY
  I build deterministic Rust runtimes, WASM execution engines, and AI
  infrastructure — high-assurance systems from the kernel to the edge.
  I ship production software solo: I own the architecture, direct AI to
  implement against contracts I design, and verify every change.

SELECTED WORK
  Kedge (kedge-rt) — deterministic AI-agent harness, Rust
    · 15-crate workspace, published to crates.io (BUSL-1.1)
    · Shadow-Guard: fail-safe interception of mutating tool calls (dry-run)
    · AST compaction (Tree-sitter, 5 languages) — signatures kept, bodies elided
    · SQLite-WAL ledger: byte-for-byte deterministic replay + token-budget caps
    · Core classifier compiled to WebAssembly — runs live in the browser

  WorldFrame — desktop worldbuilding app, Tauri + Rust  (shipped)
    · Ed25519 licensing, hard online verification, auto-update in production
    · E2EE cloud sync · real users, real purchases · tryworldframe.com

  nlj.dev — this site: a working retro OS in the browser + a live systems lab

SKILLS
  Languages   Rust · TypeScript · JavaScript · Python
  Systems     WebAssembly · eBPF (experimental) · Tree-sitter · SQLite
  AI infra    LLM agent harnesses · RAG · MCP protocol · prompt-injection defense
  Edge / Web  Cloudflare Workers · React · Tauri

CONTACT
  noel@nlj.dev · github.com/nlj3
`

const KEDGE = `
kedge — architecture spec
─────────────────────────
A deterministic AI-agent execution harness & verifiable ledger. 15 crates.

  kedge            CLI entrypoint (clap)
  ├─ kedge-core    ReAct state machine · budget enforcement · Send + Sync
  ├─ kedge-ledger  SQLite (WAL) append-only event log · deterministic replay
  ├─ kedge-compact Tree-sitter AST compactor (Rust/Py/JS/TS/Go) · no LLM
  │  └─ kedge-cache  content-hashed compaction cache
  ├─ kedge-audit   Shadow-Guard dry-run interceptor · forensic report
  ├─ kedge-exec    isolated Tokio subprocess runner (process groups)
  ├─ kedge-llm     OpenAI-compatible reasoner (OpenAI/Ollama/vLLM/LM Studio)
  ├─ kedge-mcp     native Model Context Protocol client (stdio + HTTP)
  ├─ kedge-policy  user-space guardrails (blocked tools, PII redaction)
  ├─ kedge-mesh    bounded subagent supervision / orchestration
  ├─ kedge-hitl    human-in-the-loop approval gate
  ├─ kedge-server  embedded REST control API (axum)
  ├─ kedge-eval    event-sourced regression harness
  └─ kedge-probe   kernel eBPF LSM supervision (Linux · experimental)

ISOLATION
  user space   : kedge-policy + Shadow-Guard (fail-safe, cross-platform)
  process      : kedge-exec (process-group teardown)
  kernel       : kedge-probe (eBPF LSM, Linux, experimental)

  source: github.com/nlj3/kedge · crates.io/crates/kedge
`

async function keys() {
  const grab = async (url) => {
    try { const r = await fetch(url, { cf: { cacheTtl: 300 } }); return r.ok ? (await r.text()).trim() : '' } catch { return '' }
  }
  const [ssh, gpg] = await Promise.all([grab('https://github.com/nlj3.keys'), grab('https://github.com/nlj3.gpg')])
  return `# SSH public keys — github.com/nlj3.keys\n${ssh || '(none published)'}\n\n` +
    `# GPG public key — github.com/nlj3.gpg\n${gpg || '(none published)'}\n`
}

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const ua = request.headers.get('user-agent') || ''
    const path = url.pathname.replace(/\/+$/, '') || '/'

    // browsers → send them to the real site (unless they ask for a raw route)
    if (!isCli(ua) && path === '/') {
      return Response.redirect('https://nlj.dev/', 302)
    }

    switch (path) {
      case '/':        return new Response(HOME, { headers: CT })
      case '/resume':  return new Response(RESUME, { headers: CT })
      case '/kedge':   return new Response(KEDGE, { headers: CT })
      case '/keys':    return new Response(await keys(), { headers: CT })
      default:
        return new Response(`not found: ${path}\ntry: /  /resume  /kedge  /keys\n`, { status: 404, headers: CT })
    }
  },
}
