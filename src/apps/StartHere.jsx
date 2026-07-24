import { useOS } from '../store.js'

// The first thing a recruiter or client sees. Job: in ~30 seconds — who I am,
// what level, my edge, proof it's real, and one obvious next step.
const STACK = ['React', 'Rust', 'Cloudflare', 'three.js', 'TypeScript']

export default function StartHere() {
  const openApp = useOS((s) => s.openApp)

  return (
    <div className="starthere">
      <div className="sh-hero">
        <div className="sh-badge">🤖</div>
        <div className="sh-hero-text">
          <h1 className="sh-name">Noel Jackson</h1>
          <p className="sh-role">AI-native software engineer</p>
        </div>
      </div>

      <p className="sh-lead">
        I ship <b>production software solo</b> — desktop, web, and edge —
        directing AI to build and maintain more than one developer normally could.
      </p>

      <div className="sh-tags">
        {STACK.map((t) => <span className="sh-tag" key={t}>{t}</span>)}
      </div>

      <button className="sh-cta" onClick={() => openApp('scope')}>
        <span>Hire me — start a project</span>
        <span className="sh-cta-arrow">→</span>
      </button>

      <div className="sh-section-label">Featured work</div>
      <div className="sh-actions">
        <button className="sh-card" onClick={() => openApp('worldframe')}>
          <span className="sh-card-emoji">🌍</span>
          <span className="sh-card-text">
            <b>WorldFrame</b>
            <small>My flagship — a desktop worldbuilding app, live and in users&rsquo; hands. Tauri&nbsp;+&nbsp;Rust.</small>
          </span>
          <span className="sh-card-tag live">Live ↗</span>
        </button>
        <button className="sh-card" onClick={() => openApp('kedge')}>
          <span className="sh-card-emoji">🦀</span>
          <span className="sh-card-text">
            <b>Kedge</b>
            <small>A deterministic AI-agent harness in Rust. It intercepts unsafe actions before they run — try it live.</small>
          </span>
          <span className="sh-card-tag live">Run it</span>
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
        <a href="mailto:noeljacksonjs@gmail.com">noeljacksonjs@gmail.com</a>
        <span className="sh-dot">·</span>
        <a href="https://github.com/SturdyRobot" target="_blank" rel="noopener noreferrer">GitHub&nbsp;↗</a>
        <span className="sh-dot">·</span>
        <a href="https://tryworldframe.com" target="_blank" rel="noopener noreferrer">tryworldframe.com&nbsp;↗</a>
      </div>
    </div>
  )
}
