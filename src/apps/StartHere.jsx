import { useOS } from '../store.js'

// The first thing a recruiter or hiring manager sees. Job: in ~30 seconds — who I
// am, what level, my edge, proof it's real, and one obvious next step. Positioning
// leads with the systems depth (Rust / WASM / infra), not the frontend.
const STACK = ['Rust', 'WebAssembly', 'Systems', 'TypeScript', 'Cloudflare']

export default function StartHere() {
  const openApp = useOS((s) => s.openApp)
  const startTour = useOS((s) => s.startTour)

  return (
    <div className="starthere">
      <div className="sh-hero">
        <div className="sh-badge">🤖</div>
        <div className="sh-hero-text">
          <h1 className="sh-name">Noel Jackson</h1>
          <p className="sh-role">Systems &amp; AI Infrastructure Engineer</p>
        </div>
      </div>

      <p className="sh-lead">
        I build <b>deterministic Rust runtimes</b>, WASM execution engines, and AI
        infrastructure — engineering high-assurance systems from the kernel to the edge.
      </p>

      <div className="sh-tags">
        {STACK.map((t) => <span className="sh-tag" key={t}>{t}</span>)}
      </div>

      <a className="sh-cta" href="mailto:noel@nlj.dev">
        <span>Contact Noel — noel@nlj.dev</span>
        <span className="sh-cta-arrow">→</span>
      </a>

      <button className="sh-tour" onClick={startTour}>
        ▶ Short on time? Take the 60-second tour
      </button>

      <div className="sh-section-label">Featured work</div>
      <div className="sh-actions">
        <button className="sh-card" onClick={() => openApp('kedge')}>
          <span className="sh-card-emoji">🦀</span>
          <span className="sh-card-text">
            <b>Kedge</b>
            <small>My flagship — a deterministic AI-agent harness in Rust. The real safety classifier, compiled to WebAssembly, intercepts unsafe actions live in your browser.</small>
          </span>
          <span className="sh-card-tag live">Run it ↗</span>
        </button>
        <button className="sh-card" onClick={() => openApp('worldframe')}>
          <span className="sh-card-emoji">🌍</span>
          <span className="sh-card-text">
            <b>WorldFrame</b>
            <small>A desktop worldbuilding application built with Tauri&nbsp;+&nbsp;Rust — shipped, and in users&rsquo; hands.</small>
          </span>
          <span className="sh-card-tag live">Live ↗</span>
        </button>
        <button className="sh-card" onClick={() => openApp('hub')}>
          <span className="sh-card-emoji">🐙</span>
          <span className="sh-card-text">
            <b>All projects</b>
            <small>Every app, tool, and game — each one running right here.</small>
          </span>
          <span className="sh-card-tag arrow">→</span>
        </button>
      </div>

      <p className="sh-hint">
        This whole site is a <b>working OS I built</b> — every icon is real. Open a few and poke around.
      </p>

      <div className="sh-links">
        <a href="mailto:noel@nlj.dev">noel@nlj.dev</a>
        <span className="sh-dot">·</span>
        <a href="https://github.com/nlj3" target="_blank" rel="noopener noreferrer">GitHub&nbsp;↗</a>
        <span className="sh-dot">·</span>
        <a href="https://tryworldframe.com" target="_blank" rel="noopener noreferrer">tryworldframe.com&nbsp;↗</a>
      </div>
    </div>
  )
}
