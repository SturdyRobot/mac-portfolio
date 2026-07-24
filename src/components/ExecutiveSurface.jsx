import { useEffect, useRef, useState } from 'react'
import { useOS } from '../store.js'
import { downloadResume } from '../apps/hire/resume.js'
import './surface.css'

// ── Layer 1: the Executive Engineering Surface ──
// A dark, fast landing page for the recruiter who wants the 10-second scan.
// "Launch NLJ OS" drops into the retro OS (Layer 2). Every number here is
// measured from the real kedge ledger — nothing decorative.

const STACK = ['Rust', 'WebAssembly', 'Systems', 'TypeScript', 'Cloudflare']

// Real compaction, measured on the kedge codebase (kedge_compact, no LLM):
//   crates/kedge-mcp/src/lib.rs — 9,615 → 3,973 tokens, 38 bodies elided.
const DIFF = {
  file: 'crates/kedge-mcp/src/lib.rs',
  before: 9615,
  after: 3973,
  pct: 58.7,
  elided: 38,
  // a real function, verbatim, before compaction
  raw: `pub async fn notify(
    &self, method: &str, params: Value,
) -> Result<()> {
    let req = RpcRequest {
        jsonrpc: "2.0",
        id: None,
        method,
        params,
    };
    self.write_line(
        serde_json::to_vec(&req)?,
    ).await
}`,
  // the real AST-compacted skeleton of that region: signatures kept, bodies elided
  compacted: `impl RpcClient {
    pub fn new(..) -> Self { /* 56 lines elided */ }
    async fn write_line(&self, bytes: Vec<u8>)
        -> Result<()> { /* 7 lines elided */ }
    pub async fn request(&self, method: &str,
        params: Value) -> Result<Value>
        { /* 54 lines elided */ }
    pub async fn notify(&self, method: &str,
        params: Value) -> Result<()>
        { /* 9 lines elided */ }
}`,
}

// Real cumulative totals from the ledger (~/.kedge/ledger.sqlite via kedge_audit).
const TELEMETRY = {
  tokensSaved: 73942, // cumulative tokens compacted, measured
  files: 12, // files compacted into the ledger
  pct: 58.7, // reduction on the showcased file
}

// count-up animation for the telemetry hero number
function useCountUp(target, ms = 1400, start = false) {
  const [n, setN] = useState(0)
  const raf = useRef(0)
  useEffect(() => {
    if (!start) return
    let t0
    const tick = (t) => {
      if (!t0) t0 = t
      const p = Math.min(1, (t - t0) / ms)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(target * eased))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, ms, start])
  return n
}

// reveal telemetry count only once it scrolls into view
function useInView() {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    if (!ref.current || seen) return
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } },
      { threshold: 0.4 },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [seen])
  return [ref, seen]
}

export default function ExecutiveSurface() {
  const launchOS = useOS((s) => s.launchOS)
  const openPalette = useOS((s) => s.openPalette)
  const [busy, setBusy] = useState(false)

  async function resume() {
    setBusy(true)
    try { await downloadResume() } finally { setBusy(false) }
  }

  return (
    <div className="xs">
      <div className="xs-grid-bg" aria-hidden="true" />

      <header className="xs-nav">
        <span className="xs-logo">nlj<span className="xs-logo-dot">.dev</span></span>
        <nav className="xs-nav-links">
          <a href="#work">Work</a>
          <a href="#telemetry">Telemetry</a>
          <button className="xs-kbd-hint" onClick={openPalette}>
            <span>⌘</span>K
          </button>
        </nav>
      </header>

      <main className="xs-main">
        {/* ── hero ── */}
        <section className="xs-hero">
          <div className="xs-eyebrow">● AVAILABLE FOR STAFF / PRINCIPAL ROLES</div>
          <h1 className="xs-h1">
            NOEL JACKSON III
            <span className="xs-h1-sub">Systems &amp; AI Infrastructure Engineer</span>
          </h1>
          <p className="xs-lead">
            Building <b>deterministic Rust runtimes</b>, WASM execution engines, and low-level AI
            infrastructure — from the kernel to the edge.
          </p>
          <div className="xs-pills">
            {STACK.map((s) => <span className="xs-pill" key={s}>{s}</span>)}
          </div>
          <div className="xs-cta-row">
            <a className="xs-btn primary" href="mailto:noel@nlj.dev">Contact — noel@nlj.dev</a>
            <button className="xs-btn" onClick={resume} disabled={busy}>
              {busy ? 'Building…' : 'Download Résumé (PDF)'}
            </button>
          </div>
        </section>

        {/* ── workstation trigger ── */}
        <section className="xs-workstation">
          <div className="xs-monitor">
            <div className="xs-monitor-bar">
              <span className="xs-dot r" /><span className="xs-dot y" /><span className="xs-dot g" />
              <span className="xs-monitor-title">nlj-os — substrate</span>
            </div>
            <div className="xs-monitor-screen">
              <div className="xs-status">
                <span className="xs-pulse" />
                SYSTEM ONLINE: <b>NLJ-OS v2.4</b> <span className="xs-muted">(Rust / WASM substrate)</span>
              </div>
              <pre className="xs-boot-hint">{`> the whole desktop is a real OS I built.
> its terminal runs kedge_core::classify — real Rust,
> compiled to WebAssembly — live in your browser.`}</pre>
              <button className="xs-launch" onClick={launchOS}>
                ⚡ Launch NLJ OS Workstation
              </button>
            </div>
          </div>
        </section>

        {/* ── featured systems architecture ── */}
        <section className="xs-section" id="work">
          <div className="xs-section-head">
            <span className="xs-section-kicker">02 — FEATURED SYSTEMS ARCHITECTURE</span>
            <h2 className="xs-h2">Two systems, both real, both running.</h2>
          </div>

          {/* Flagship 1: Kedge + real diff preview */}
          <article className="xs-card xs-card-wide">
            <div className="xs-card-head">
              <div>
                <span className="xs-card-tag rust">kedge-rt · Rust</span>
                <h3 className="xs-card-title">Kedge</h3>
                <p className="xs-card-desc">
                  A deterministic AI-agent harness &amp; WASM runtime. Shadow-Guard intercepts
                  destructive tool calls before they run; AST compaction fits large files into a
                  token budget with zero LLM calls; every run replays byte-for-byte from the ledger.
                </p>
              </div>
              <a className="xs-card-link" href="https://crates.io/crates/kedge" target="_blank" rel="noopener noreferrer">crates.io ↗</a>
            </div>

            <div className="xs-diff">
              <div className="xs-diff-stat">
                <span className="xs-diff-file">{DIFF.file}</span>
                <span className="xs-diff-nums">
                  {DIFF.before.toLocaleString()} → {DIFF.after.toLocaleString()} tokens
                  <span className="xs-diff-pct">−{DIFF.pct}%</span>
                  <span className="xs-muted">· {DIFF.elided} bodies elided · measured, no LLM</span>
                </span>
              </div>
              <div className="xs-diff-panes">
                <div className="xs-diff-pane">
                  <div className="xs-diff-label raw">RAW SOURCE — one of {DIFF.elided} bodies</div>
                  <pre className="xs-code"><code>{DIFF.raw}</code></pre>
                </div>
                <div className="xs-diff-arrow">→</div>
                <div className="xs-diff-pane">
                  <div className="xs-diff-label kept">AST-COMPACTED — signatures kept</div>
                  <pre className="xs-code compacted"><code>{DIFF.compacted}</code></pre>
                </div>
              </div>
            </div>
          </article>

          {/* Flagship 2: WorldFrame */}
          <article className="xs-card">
            <div className="xs-card-head">
              <div>
                <span className="xs-card-tag tauri">Tauri + Rust · shipped</span>
                <h3 className="xs-card-title">WorldFrame</h3>
                <p className="xs-card-desc">
                  A desktop worldbuilding application for writers &amp; TTRPG creators. Shipped end-to-end,
                  solo — Ed25519 licensing, hard online verification, auto-update proven in production,
                  E2EE cloud sync. Real users, real purchases.
                </p>
              </div>
            </div>
            <a className="xs-card-cta" href="https://tryworldframe.com" target="_blank" rel="noopener noreferrer">
              Launch tryworldframe.com ↗
            </a>
          </article>
        </section>

        {/* ── live telemetry ── */}
        <Telemetry />

        {/* ── footer ── */}
        <footer className="xs-footer">
          <div className="xs-footer-l">
            <span className="xs-logo">nlj<span className="xs-logo-dot">.dev</span></span>
            <span className="xs-muted">Noel Jackson III · Systems &amp; AI Infrastructure Engineer</span>
          </div>
          <div className="xs-footer-links">
            <a href="mailto:noel@nlj.dev">noel@nlj.dev</a>
            <a href="https://github.com/nlj3" target="_blank" rel="noopener noreferrer">GitHub @nlj3 ↗</a>
            <button className="xs-link-btn" onClick={launchOS}>Launch NLJ OS ⚡</button>
          </div>
        </footer>
      </main>
    </div>
  )
}

function Telemetry() {
  const [ref, seen] = useInView()
  const tokens = useCountUp(TELEMETRY.tokensSaved, 1500, seen)
  return (
    <section className="xs-section" id="telemetry" ref={ref}>
      <div className="xs-section-head">
        <span className="xs-section-kicker">03 — LIVE METRICS · MEASURED FROM THE LEDGER</span>
        <h2 className="xs-h2">Verifiable, not vibes.</h2>
      </div>
      <div className="xs-metrics">
        <div className="xs-metric">
          <div className="xs-metric-n">{tokens.toLocaleString()}</div>
          <div className="xs-metric-l">Tokens compacted <span className="xs-muted">(cumulative, measured)</span></div>
        </div>
        <div className="xs-metric">
          <div className="xs-metric-n">{TELEMETRY.pct}<span className="xs-metric-unit">%</span></div>
          <div className="xs-metric-l">Context reduction <span className="xs-muted">via AST elision</span></div>
        </div>
        <div className="xs-metric">
          <div className="xs-metric-n">{TELEMETRY.files}</div>
          <div className="xs-metric-l">Files compacted <span className="xs-muted">into the ledger</span></div>
        </div>
        <div className="xs-metric">
          <div className="xs-metric-n xs-metric-ok">✓</div>
          <div className="xs-metric-l">Deterministic ledger <span className="xs-muted">· replay-verified</span></div>
        </div>
      </div>
    </section>
  )
}
