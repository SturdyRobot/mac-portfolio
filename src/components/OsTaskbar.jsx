import { useEffect, useState } from 'react'
import { useOS } from '../store.js'
import { getApp } from '../apps.js'
import './os-taskbar.css'

// Bottom taskbar for the NLJ OS workstation: Start (→ palette), active window
// tabs, live clock, and Exit OS. Complements the top menu bar.
function Clock() {
  const [t, setT] = useState('')
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000 * 15)
    return () => clearInterval(id)
  }, [])
  return <span className="tb-clock">{t}</span>
}

export default function OsTaskbar() {
  const windows = useOS((s) => s.windows)
  const openApp = useOS((s) => s.openApp)
  const focus = useOS((s) => s.focus)
  const exitOS = useOS((s) => s.exitOS)
  const openPalette = useOS((s) => s.openPalette)

  const top = windows.reduce((a, b) => (a && a.z > b.z ? a : b), null)

  return (
    <div className="tb">
      <button className="tb-start" onClick={openPalette} title="Command palette (⌘K)">
        <span className="tb-start-mark">◆</span> NLJ-OS
      </button>

      <div className="tb-tabs">
        {windows.map((w) => {
          const app = getApp(w.appId)
          const active = !w.minimized && top && top.id === w.id
          return (
            <button
              key={w.id}
              className={`tb-tab${active ? ' active' : ''}${w.minimized ? ' min' : ''}`}
              onClick={() => (w.minimized ? openApp(w.appId) : focus(w.id))}
              title={w.title}
            >
              <span className="tb-tab-ico">{typeof app?.icon === 'string' ? app.icon : '▪'}</span>
              <span className="tb-tab-label">{w.title}</span>
            </button>
          )
        })}
      </div>

      <div className="tb-right">
        <Clock />
        <button className="tb-exit" onClick={exitOS} title="Return to landing (Esc)">✖ Exit OS</button>
      </div>
    </div>
  )
}
