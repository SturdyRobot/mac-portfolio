import { useEffect, useState } from 'react'
import MenuBar from './components/MenuBar.jsx'
import Desktop from './components/Desktop.jsx'
import Window from './components/Window.jsx'
import Dialog from './components/Dialog.jsx'
import BootSequence from './components/BootSequence.jsx'
import TourController from './components/TourController.jsx'
import ExecutiveSurface from './components/ExecutiveSurface.jsx'
import CommandPalette from './components/CommandPalette.jsx'
import OsTaskbar from './components/OsTaskbar.jsx'
import { useOS } from './store.js'
import { applyTheme } from './themes.js'

// Cold-boot once per browser session — re-entering the OS in the same tab lands
// straight on the desktop, but a fresh launch gets the full BIOS boot.
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
  const os = useOS((s) => s.os)
  const exitOS = useOS((s) => s.exitOS)
  const dialog = useOS((s) => s.dialog)
  const paletteOpen = useOS((s) => s.palette)
  const togglePalette = useOS((s) => s.togglePalette)
  const closePalette = useOS((s) => s.closePalette)
  const [booting, setBooting] = useState(() => os && shouldBoot())

  useEffect(() => applyTheme(theme), [])

  // entering the OS: play the cold-boot (first time this session) + greet with Start Here
  useEffect(() => {
    if (!os) return
    if (shouldBoot()) setBooting(true)
    openApp('starthere')
  }, [os, openApp])

  function finishBoot() {
    try { sessionStorage.setItem('nlj-booted', '1') } catch {}
    setBooting(false)
  }

  // global keys: ⌘K / Ctrl+K toggles the palette (both layers); ESC exits the OS
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault(); togglePalette(); return
      }
      if (e.key === 'Escape') {
        if (paletteOpen) { closePalette(); return }
        const el = document.activeElement
        const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')
        if (os && !booting && !tour && !dialog && !typing) exitOS()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [os, booting, tour, dialog, paletteOpen, togglePalette, closePalette, exitOS])

  // ── Layer 1: Executive Surface (default) ──
  if (!os) {
    return (
      <>
        <ExecutiveSurface />
        <CommandPalette />
      </>
    )
  }

  // ── Layer 2: NLJ OS Workstation ──
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
      <OsTaskbar />
      <CommandPalette />

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
