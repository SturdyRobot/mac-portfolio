import { useEffect } from 'react'
import MenuBar from './components/MenuBar.jsx'
import Desktop from './components/Desktop.jsx'
import Window from './components/Window.jsx'
import Dialog from './components/Dialog.jsx'
import { useOS } from './store.js'
import { applyTheme } from './themes.js'

export default function App() {
  const windows = useOS((s) => s.windows)
  const theme = useOS((s) => s.theme)
  const power = useOS((s) => s.power)
  const setPower = useOS((s) => s.setPower)
  const openApp = useOS((s) => s.openApp)
  useEffect(() => applyTheme(theme), [])
  // greet every visitor with the "Start Here" window (openApp de-dupes)
  useEffect(() => {
    openApp('starthere')
  }, [openApp])

  return (
    <div className="screen">
      <MenuBar />
      <Desktop />
      {windows.map((w) => (
        <Window key={w.id} win={w} />
      ))}
      <Dialog />

      {power === 'sleep' && (
        <div className="sleep-overlay" onClick={() => setPower('on')}>
          <span className="sleep-hint">Click anywhere to wake…</span>
        </div>
      )}

      {power === 'off' && (
        <div className="shutdown-screen">
          <div className="shutdown-box">
            <div className="shutdown-face">◡</div>
            <p>It is now safe to turn off your computer.</p>
            <button className="btn" onClick={() => window.location.reload()}>
              Restart
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
