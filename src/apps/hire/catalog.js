// ═══════════════════════════════════════════════════════════════════
//  HIRE ME — the catalog + the client-side "how I'd approach it" engine.
//  Everything here runs 100% offline: pick a role, describe the problem,
//  and get a tailored technical brief with no network at all. The edge
//  proxy (if configured) only *sharpens* the prose — it's never required.
// ═══════════════════════════════════════════════════════════════════

export const ROLES = [
  { id: 'systems', icon: '🦀', label: 'Systems / Infra', blurb: 'runtimes, performance, low-level' },
  { id: 'ai', icon: '🧠', label: 'AI / ML Platform', blurb: 'agents, RAG, LLM infrastructure' },
  { id: 'backend', icon: '⚙️', label: 'Backend / Platform', blurb: 'APIs, data, reliability' },
  { id: 'fullstack', icon: '🧩', label: 'Full-stack Product', blurb: 'ship features end-to-end' },
  { id: 'founding', icon: '🚀', label: 'Founding Engineer', blurb: 'own everything, move fast' },
]
export const ROLE_BY_ID = Object.fromEntries(ROLES.map((r) => [r.id, r]))

export const PRIORITIES = [
  { id: 'ownership', label: 'Ownership & autonomy' },
  { id: 'depth', label: 'Deep technical depth' },
  { id: 'velocity', label: 'Ship velocity' },
  { id: 'ai', label: 'AI / LLM experience' },
  { id: 'rust', label: 'Rust / systems' },
  { id: 'product', label: 'Product sense' },
  { id: 'communication', label: 'Communication' },
  { id: 'reliability', label: 'Reliability / rigor' },
]

// Noel's real proof points — the client-side generator maps a stated problem to
// whichever of these it can honestly stand behind.
const PROOF = {
  kedge: 'Kedge — my deterministic AI-agent harness in Rust (compiled to WebAssembly; its classifier is running elsewhere on this very site)',
  worldframe: 'WorldFrame — a desktop app I shipped end-to-end with Tauri + Rust, in real users’ hands',
  edge: 'a hardened Cloudflare Worker (rate-limited, prompt-injection-defended) that fronts an LLM — the one powering this page',
}

// keyword → (approach line, recommended tech, risk, proof key)
const SIGNALS = [
  {
    re: /\b(rag|retrieval|embedding|vector|knowledge base|semantic search|chatbot|assistant|documents?)\b/i,
    approach: 'Treat it as a retrieval problem first, not a model problem: hosted LLM APIs + a vector store, hybrid (keyword + semantic) search, and strict schema validation on every hop so bad context can’t reach the model.',
    tech: ['pgvector / Qdrant', 'embeddings API', 'hybrid search', 'Zod-validated boundaries'],
    risk: 'Retrieval accuracy and context quality — the failure mode is confident wrong answers, so I’d instrument it end-to-end before scaling.',
    proof: 'kedge',
  },
  {
    re: /\b(agent|autonomous|tool[- ]?use|workflow|orchestrat|multi[- ]?step|pipeline)\b/i,
    approach: 'Put the agent behind a harness that classifies every action before it runs — allow read-only, intercept anything mutating — with a deterministic replay log so a run’s effect is verifiable, not vibes. This is exactly what Kedge does.',
    tech: ['action classification', 'deterministic replay', 'hard budgets', 'sandboxed execution'],
    risk: 'Unbounded / unsafe actions. I’d make the safe path the default and force everything else through explicit review.',
    proof: 'kedge',
  },
  {
    re: /\b(rust|performance|latency|throughput|memory|low[- ]?level|systems?|kernel|wasm|webassembly|native)\b/i,
    approach: 'Profile before rewriting, then push the hot path into Rust (and WebAssembly where it needs to run at the edge or in-browser). Measure in microseconds, not adjectives.',
    tech: ['Rust', 'WebAssembly', 'criterion benchmarks', 'flamegraphs'],
    risk: 'Optimising the wrong thing. I’d land a measurement harness first so every change is provably faster.',
    proof: 'kedge',
  },
  {
    re: /\b(edge|cloudflare|worker|serverless|global|cdn|distributed)\b/i,
    approach: 'Run the logic at the edge, close to users, with a tiny stateless core and hard limits (rate, body size, token budget) baked in from day one — the way this site’s own LLM proxy is built.',
    tech: ['Cloudflare Workers', 'KV / Durable Objects', 'edge caching', 'strict rate limits'],
    risk: 'State and consistency at the edge. I’d keep the edge stateless and push state to a single authority.',
    proof: 'edge',
  },
  {
    re: /\b(desktop|tauri|electron|native app|offline|cross[- ]?platform)\b/i,
    approach: 'Ship it as a Tauri app: a Rust core with a web UI, small binaries, real OS integration — the same stack I shipped WorldFrame on.',
    tech: ['Tauri', 'Rust core', 'auto-update', 'code signing'],
    risk: 'Update + signing pipelines. I’d get auto-update and notarisation working before feature work, because retrofitting them hurts.',
    proof: 'worldframe',
  },
]

// A generic spine used when nothing specific matches — still concrete, never fluff.
const DEFAULT_SIGNAL = {
  approach: 'Start by writing the contract — the interfaces and the definition of "done" — then build the thinnest vertical slice that proves the risky part works, and harden from there.',
  tech: ['TypeScript', 'a typed data layer', 'CI with real checks'],
  risk: 'Scope creep before the core is proven. I’d ship the riskiest slice first.',
  proof: 'kedge',
}

/**
 * Build a tailored technical brief from the intake — 100% client-side.
 * @returns {{ headline: string, steps: string[], stack: string[], risks: string[], proof: string[] }}
 */
export function buildApproach(intake) {
  const role = ROLE_BY_ID[intake.role]
  const text = `${intake.problem || ''} ${intake.stack || ''}`
  const hits = SIGNALS.filter((s) => s.re.test(text))
  const used = hits.length ? hits.slice(0, 3) : [DEFAULT_SIGNAL]

  const stack = [...new Set(used.flatMap((s) => s.tech))].slice(0, 6)
  const risks = [...new Set(used.map((s) => s.risk))].slice(0, 3)
  const proof = [...new Set(used.map((s) => PROOF[s.proof]))].slice(0, 2)

  const roleLine = role
    ? `For a ${role.label} role, here’s how I’d start on the problem you described:`
    : 'Here’s how I’d start on the problem you described:'
  const steps = used.map((s) => s.approach)
  // always close on verification — it's the throughline of everything I build
  steps.push('Throughout, I’d keep every change verifiable — tests and real measurements before it lands, never "looks fine to me."')

  return { headline: roleLine, steps, stack, risks, proof }
}
