import { apps } from '../apps.js'
import { useOS } from '../store.js'

function DesktopIcon({ app }) {
  const openApp = useOS((s) => s.openApp)
  return (
    <div className="desktop-icon" onDoubleClick={() => openApp(app.id)}>
      <div className="desktop-icon-glyph">
        {typeof app.icon === 'function' ? <app.icon size={34} /> : app.icon}
      </div>
      <div className="desktop-icon-label">{app.name}</div>
    </div>
  )
}

export default function Desktop() {
  const iconSort = useOS((s) => s.iconSort)
  let desktopApps = apps.filter((a) => a.onDesktop)
  if (iconSort === 'name') {
    desktopApps = [...desktopApps].sort((a, b) => a.name.localeCompare(b.name))
  } else if (iconSort === 'kind') {
    desktopApps = [...desktopApps].sort(
      (a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name),
    )
  }
  return (
    <div className="desktop">
      <div className="icon-column">
        {desktopApps.map((a) => (
          <DesktopIcon key={a.id} app={a} />
        ))}
      </div>
    </div>
  )
}
