import { useEffect, useRef, useState } from 'react'
import { useOS } from '../store.js'

// ── the 60-second recruiter auto-tour ──
// A busy hiring manager won't open an OS and go poking. So this performs the
// highlights for them: opens the flagship, runs the real engine live, shows the
// work is a real OS, and lands on "here's how to reach me." Cancel any time
// (Skip button or Esc). Drives the OS purely through the store.
export default function TourController() {
  const openApp = useOS((s) => s.openApp)
  const closeAll = useOS((s) => s.closeAll)
  const runInTerminal = useOS((s) => s.runInTerminal)
  const endTour = useOS((s) => s.endTour)
  const [i, setI] = useState(0)
  const timer = useRef(null)

  const STEPS = [
    {
      ms: 3200,
      caption: "Hi — I'm Noel. Sixty seconds, and you'll have seen the real work.",
      act: () => { closeAll(); openApp('starthere') },
    },
    {
      ms: 4200,
      caption: 'My flagship is Kedge — a deterministic AI-agent harness, written in Rust.',
      act: () => openApp('kedge'),
    },
    {
      ms: 7000,
      caption: 'Here is the real engine — Rust compiled to WebAssembly — catching a dangerous command, live.',
      act: () => { openApp('terminal'); runInTerminal('run rm -rf /') },
    },
    {
      ms: 5600,
      caption: '…and passing a safe one. The same engine, deciding in real time.',
      act: () => runInTerminal('run ls -la'),
    },
    {
      ms: 5600,
      caption: 'Every icon here is a real, running app. The whole site is an OS I built from scratch.',
      act: () => openApp('hub'),
    },
    {
      ms: 6000,
      caption: "Hiring? “Hire Noel” walks through exactly how I'd approach your problem.",
      act: () => { closeAll(); openApp('scope') },
    },
    {
      ms: null, // final — hold until the visitor chooses
      caption: 'That is the tour. If it resonated, let us talk.',
      final: true,
      act: () => { closeAll(); openApp('starthere') },
    },
  ]

  // run each step's action, then schedule the next
  useEffect(() => {
    const s = STEPS[i]
    if (!s) { endTour(); return }
    s.act && s.act()
    if (s.ms) {
      timer.current = setTimeout(() => setI((n) => n + 1), s.ms)
      return () => clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i])

  // Esc cancels
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') stop() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function stop() { clearTimeout(timer.current); endTour() }
  function replay() { clearTimeout(timer.current); setI(0) }

  const step = STEPS[i] || STEPS[STEPS.length - 1]
  const total = STEPS.length

  return (
    <div className="tour">
      <div className="tour-bar">
        <span className="tour-face">🤖</span>
        <div className="tour-text">
          <div className="tour-caption">{step.caption}</div>
          <div className="tour-dots">
            {STEPS.map((_, k) => (
              <span key={k} className={`tour-dot${k === i ? ' on' : ''}${k < i ? ' done' : ''}`} />
            ))}
          </div>
        </div>
        {step.final ? (
          <div className="tour-final">
            <a className="tour-btn primary" href="mailto:noel@nlj.dev">Email me →</a>
            <button className="tour-btn" onClick={replay}>Replay</button>
            <button className="tour-btn ghost" onClick={stop}>Done</button>
          </div>
        ) : (
          <button className="tour-btn ghost" onClick={stop}>Skip ✕</button>
        )}
      </div>
    </div>
  )
}
