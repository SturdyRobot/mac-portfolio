import { useMemo, useState } from 'react'
import './crategraph.css'

// Real workspace, extracted from `cargo metadata` on the kedge repo.
// deps = intra-workspace dependencies; ext = the notable external crates.
const CRATES = {
  'kedge-core':    { desc: 'Domain models, the ReAct state machine, token-budget enforcement, and the shared error type.', deps: [], ext: ['serde', 'tokio'], iso: 'user-space · Send + Sync core' },
  'kedge-ledger':  { desc: 'SQLite (WAL) audit logging and byte-for-byte deterministic replay of agent trajectories.', deps: ['kedge-core'], ext: ['rusqlite'], iso: 'append-only event ledger' },
  'kedge-compact': { desc: 'Multi-language (Rust/Python/JS/TS/Go) Tree-sitter AST token compactor. Deterministic, no LLM.', deps: ['kedge-core'], ext: ['tree-sitter'], iso: 'pure function · content-addressable' },
  'kedge-cache':   { desc: 'Content-hashed cache of deterministic compaction results — never invokes an LLM.', deps: ['kedge-compact'], ext: ['rusqlite'], iso: 'hash-keyed store' },
  'kedge-exec':    { desc: 'Isolated Tokio subprocess runner with process-group teardown and auto-detected shells.', deps: ['kedge-core'], ext: ['tokio'], iso: 'process-group isolation' },
  'kedge-llm':     { desc: 'OpenAI-compatible chat reasoner (OpenAI / Ollama / vLLM / LM Studio).', deps: ['kedge-core'], ext: ['reqwest'], iso: 'egress boundary' },
  'kedge-policy':  { desc: 'Lightweight user-space guardrails: blocked tools, PII redaction, budget checks.', deps: ['kedge-core'], ext: ['tokio'], iso: 'user-space policy gate' },
  'kedge-audit':   { desc: 'Shadow-Guard dry-run interceptor + forensic ROI / security report over the ledger.', deps: ['kedge-core', 'kedge-ledger'], ext: [], iso: 'fail-safe interception (dry-run)' },
  'kedge-eval':    { desc: 'Event-sourced prompt & agent regression harness — compares runs against a baseline.', deps: ['kedge-core', 'kedge-ledger'], ext: [], iso: 'replay-based' },
  'kedge-mcp':     { desc: 'Native Model Context Protocol (MCP) JSON-RPC 2.0 client over stdio and streamable HTTP.', deps: ['kedge-core', 'kedge-ledger'], ext: ['reqwest'], iso: 'sandboxed tool transport' },
  'kedge-mesh':    { desc: 'Bounded Tokio subagent supervision and multi-agent orchestration.', deps: ['kedge-core', 'kedge-ledger'], ext: ['tokio'], iso: 'bounded concurrency' },
  'kedge-probe':   { desc: 'Kernel-level process supervision via eBPF LSM (Linux). Experimental.', deps: ['kedge-core', 'kedge-ledger'], ext: ['aya'], iso: 'kernel eBPF · Linux only' },
  'kedge-hitl':    { desc: 'Human-in-the-loop approval gate — pauses the ReAct loop on high-risk tools.', deps: ['kedge-audit', 'kedge-core', 'kedge-ledger'], ext: ['reqwest'], iso: 'blocking approval gate' },
  'kedge-server':  { desc: 'Embedded REST control API — inspect runs and resolve pending approvals.', deps: ['kedge-core', 'kedge-hitl', 'kedge-ledger'], ext: ['axum'], iso: 'control-plane API' },
  'kedge':         { desc: 'The CLI: a high-throughput, deterministic agent execution harness with a verifiable ledger.', deps: ['kedge-audit', 'kedge-compact', 'kedge-core', 'kedge-eval', 'kedge-exec', 'kedge-hitl', 'kedge-ledger', 'kedge-llm', 'kedge-mcp', 'kedge-server'], ext: ['clap'], iso: 'entrypoint' },
}

const short = (n) => (n === 'kedge' ? 'kedge' : n.replace('kedge-', ''))
const REPO = (n) => `https://github.com/nlj3/kedge/tree/main/crates/${n}`

// longest-path level from the leaves → a layered DAG (foundation at the bottom)
function layout() {
  const level = {}
  const of = (n, seen = new Set()) => {
    if (n in level) return level[n]
    if (seen.has(n)) return 0
    seen.add(n)
    const ds = CRATES[n].deps
    level[n] = ds.length ? Math.max(...ds.map((d) => of(d, seen))) + 1 : 0
    return level[n]
  }
  Object.keys(CRATES).forEach((n) => of(n))
  const maxL = Math.max(...Object.values(level))
  const rows = {}
  Object.keys(CRATES).forEach((n) => { (rows[level[n]] ||= []).push(n) })
  const W = 1000, rowGap = 92, padY = 44
  const pos = {}
  Object.entries(rows).forEach(([l, names]) => {
    names.sort()
    names.forEach((n, i) => {
      pos[n] = { x: ((i + 1) / (names.length + 1)) * W, y: padY + (maxL - +l) * rowGap }
    })
  })
  return { pos, height: padY * 2 + maxL * rowGap, W }
}

export default function CrateGraph() {
  const { pos, height, W } = useMemo(layout, [])
  const [sel, setSel] = useState('kedge')
  const active = sel && CRATES[sel]
  const related = useMemo(() => {
    if (!sel) return new Set()
    const s = new Set([sel, ...CRATES[sel].deps])
    Object.entries(CRATES).forEach(([n, c]) => { if (c.deps.includes(sel)) s.add(n) })
    return s
  }, [sel])

  const edges = []
  Object.entries(CRATES).forEach(([n, c]) => {
    c.deps.forEach((d) => {
      const a = pos[n], b = pos[d]
      const on = sel && (n === sel || d === sel)
      edges.push(
        <path key={n + '>' + d}
          d={`M${a.x},${a.y + 15} C${a.x},${(a.y + b.y) / 2} ${b.x},${(a.y + b.y) / 2} ${b.x},${b.y - 15}`}
          className={`cg-edge${on ? ' on' : ''}`} />,
      )
    })
  })

  return (
    <section className="xs-section" id="crates">
      <div className="xs-section-head">
        <span className="xs-section-kicker">Architecture · 15-crate workspace</span>
        <h2 className="xs-h2">The kedge crate graph.</h2>
        <p className="lc-sub">Extracted from <b>cargo metadata</b> — real crates, real dependency edges. Click a node.</p>
      </div>

      <div className="cg">
        <div className="cg-canvas">
          <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="xMidYMid meet" className="cg-svg">
            <g>{edges}</g>
            {Object.keys(CRATES).map((n) => {
              const p = pos[n]
              const dim = sel && !related.has(n)
              return (
                <g key={n} transform={`translate(${p.x},${p.y})`}
                  className={`cg-node${sel === n ? ' sel' : ''}${dim ? ' dim' : ''}`}
                  onMouseEnter={() => setSel(n)} onClick={() => setSel(n)}>
                  <rect x={-52} y={-15} width={104} height={30} rx={7} />
                  <text x={0} y={5} textAnchor="middle">{short(n)}</text>
                </g>
              )
            })}
          </svg>
        </div>

        {active && (
          <aside className="cg-detail">
            <div className="cg-detail-name">{sel}<span className="cg-detail-iso">{active.iso}</span></div>
            <p className="cg-detail-desc">{active.desc}</p>
            {active.deps.length > 0 && (
              <div className="cg-detail-row"><span className="cg-detail-k">depends on</span>
                <span className="cg-chips">{active.deps.map((d) => <button key={d} className="cg-chip" onClick={() => setSel(d)}>{short(d)}</button>)}</span></div>
            )}
            {active.ext.length > 0 && (
              <div className="cg-detail-row"><span className="cg-detail-k">external</span>
                <span className="cg-chips">{active.ext.map((e) => <span key={e} className="cg-chip ext">{e}</span>)}</span></div>
            )}
            <a className="cg-detail-src" href={REPO(sel)} target="_blank" rel="noopener noreferrer">crates/{sel} ↗</a>
          </aside>
        )}
      </div>
    </section>
  )
}
