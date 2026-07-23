import { useOS } from '../store.js'

// The first thing a visitor sees — says who I am, what I make, and where to go.
export default function StartHere() {
  const openApp = useOS((s) => s.openApp)

  return (
    <div className="starthere">
      <div className="sh-hero">
        <div className="sh-badge">🤖</div>
        <div>
          <h1 className="sh-name">Noel Jackson</h1>
          <p className="sh-role">Software Developer · “Sturdy Robot”</p>
        </div>
      </div>

      <p className="sh-lead">
        I&rsquo;m a software developer. I make apps, games, and small tools,
        mostly to find out whether an idea actually holds up. This site is one of
        those experiments: a working retro desktop OS where every icon is
        something I built. Open a few and have a look.
      </p>

      <div className="sh-section-label">Start here</div>
      <div className="sh-actions">
        <button className="sh-card" onClick={() => openApp('worldframe')}>
          <span className="sh-card-emoji">🌍</span>
          <span className="sh-card-text">
            <b>WorldFrame</b>
            <small>The app I spend most of my time on.</small>
          </span>
        </button>
        <button className="sh-card" onClick={() => openApp('sturdyharness')}>
          <span className="sh-card-emoji">🦀</span>
          <span className="sh-card-text">
            <b>SturdyHarness</b>
            <small>A deterministic AI-agent harness in Rust. Source on GitHub.</small>
          </span>
        </button>
        <button className="sh-card" onClick={() => openApp('playground')}>
          <span className="sh-card-emoji">🚗</span>
          <span className="sh-card-text">
            <b>RC Playground</b>
            <small>A small driving game. 3D physics with three.js + cannon-es.</small>
          </span>
        </button>
        <button className="sh-card" onClick={() => openApp('bitboy')}>
          <span className="sh-card-emoji">🎮</span>
          <span className="sh-card-text">
            <b>BitBoy</b>
            <small>A handheld I built. Jungle Run and Snake are loaded.</small>
          </span>
        </button>
        <button className="sh-card" onClick={() => openApp('about')}>
          <span className="sh-card-emoji">👤</span>
          <span className="sh-card-text">
            <b>About Me</b>
            <small>The short version, and where to find me.</small>
          </span>
        </button>
      </div>

      <p className="sh-hint">
        Everything lives in the <b>🤖 menu</b>, up in the corner. Or just
        double-click the icons on the desktop.
      </p>

      <div className="sh-links">
        <a href="mailto:noeljacksonjs@gmail.com">noeljacksonjs@gmail.com</a>
        <span className="sh-dot">·</span>
        <a href="https://github.com/SturdyRobot" target="_blank" rel="noopener noreferrer">
          github.com/SturdyRobot
        </a>
        <span className="sh-dot">·</span>
        <a href="https://tryworldframe.com" target="_blank" rel="noopener noreferrer">
          tryworldframe.com
        </a>
      </div>
    </div>
  )
}
