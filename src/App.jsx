import { useEffect, useState } from 'react'
import MenuBar from './components/MenuBar.jsx'
import Desktop from './components/Desktop.jsx'
import Window from './components/Window.jsx'
import Dialog from './components/Dialog.jsx'
import BootSequence from './components/BootSequence.jsx'
import TourController from './components/TourController.jsx'
import { useOS } from './store.js'
import { applyTheme } from './themes.js'

// Boot once per browser session — a reload in the same tab lands straight on
// the desktop, but a fresh visit gets the full cold-boot.
function shouldBoot() {
  try { return !sessionStorage.getItem('nlj-booted') } catch { return true }
}

export default function App() {
  const windows = useOS((s) => s.windows)
  const theme = useOS((s) => s.theme)
  const power = useOS((s) => s.power)
  const setPower = useOS((s) => s.setPower)
  const openApp = useOS((s) => s.openApp)
  const tour = useOS((s) => s.tour)
  const [booting, setBooting] = useState(shouldBoot)
  useEffect(() => applyTheme(theme), [])
  // greet every visitor with the "Start Here" window (openApp de-dupes)
  useEffect(() => {
    openApp('starthere')
  }, [openApp])

  function finishBoot() {
    try { sessionStorage.setItem('nlj-booted', '1') } catch {}
    setBooting(false)
  }

  return (
    <div className="screen">
      {booting && <BootSequence onDone={finishBoot} />}
      {tour && <TourController />}
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
