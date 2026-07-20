import { useOS } from '../store.js'
import { themes, getTheme } from '../themes.js'

export default function Appearance() {
  const theme = useOS((s) => s.theme)
  const setTheme = useOS((s) => s.setTheme)
  const current = getTheme(theme)

  return (
    <div className="cpanel">
      <div className="cpanel-head">
        <div className="cpanel-badge">🎨</div>
        <div>
          <h2>Appearance</h2>
          <p className="cpanel-sub">Pick a flavor for your Macintosh.</p>
        </div>
      </div>

      <div className="swatch-grid">
        {themes.map((t) => (
          <button
            key={t.key}
            className={`swatch ${theme === t.key ? 'on' : ''}`}
            onClick={() => setTheme(t.key)}
            title={t.name}
          >
            <span
              className="swatch-chip"
              style={{
                background: `radial-gradient(circle at 34% 28%, #ffffffcc, ${t.accent} 70%)`,
              }}
            />
            <span className="swatch-name">{t.name}</span>
          </button>
        ))}
      </div>

      <div className="cpanel-foot">
        Current flavor: <b>{current.name}</b> · your choice is remembered.
      </div>
    </div>
  )
}
