import { useEffect, useRef, useState } from 'react'
import { playSound } from '../sound.js'

// ── POST / boot screen ──
// A systems-engineer's cold boot: the machine mounts Noel's stack as if each
// were a kernel module, then hands off to the desktop. Doubles as a subliminal
// résumé in the first three seconds. Shows once per browser session; any click
// or key skips straight to the desktop. Honours prefers-reduced-motion.
const POST = [
  { label: 'nlj OS 8.1 — power-on self test', head: true },
  { label: 'CPU ........ high-velocity solo engineer', ok: true },
  { label: 'Memory ..... ∞', ok: true },
  { label: 'mount  /rust_core', ok: true },
  { label: 'mount  /wasm_runtime', ok: true },
  { label: 'mount  /cloudflare_edge', ok: true },
  { label: 'mount  /tauri_desktop', ok: true },
  { label: 'load   kedge_core::classify  (WebAssembly)', ok: true },
  { label: 'init   MCP protocol', ok: true },
  { label: 'verify high-assurance systems ............', ok: true },
  { label: 'starting nlj OS', run: true },
]

const reduced =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function BootSequence({ onDone }) {
  const [shown, setShown] = useState(reduced ? POST.length : 0)
  const [phase, setPhase] = useState('post') // 'post' → 'welcome' → 'leaving'
  const chimed = useRef(false)
  const finished = useRef(false)

  const chime = () => {
    if (chimed.current) return
    chimed.current = true
    playSound('boot')
  }

  // reveal POST lines one at a time
  useEffect(() => {
    if (reduced || shown >= POST.length) return
    const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 220 : 130)
    return () => clearTimeout(t)
  }, [shown])

  // once all lines are up: brief hold → welcome card → hand off
  useEffect(() => {
    if (shown < POST.length) return
    chime()
    const toWelcome = setTimeout(() => setPhase('welcome'), reduced ? 250 : 520)
    return () => clearTimeout(toWelcome)
  }, [shown])

  useEffect(() => {
    if (phase !== 'welcome') return
    const t = setTimeout(() => leave(), reduced ? 500 : 1100)
    return () => clearTimeout(t)
  }, [phase])

  function leave() {
    if (finished.current) return
    finished.current = true
    chime()
    setPhase('leaving')
    setTimeout(() => onDone && onDone(), 420) // let the fade play
  }

  // any interaction unlocks audio + skips ahead
  function skip() {
    chime()
    if (phase === 'welcome' || shown >= POST.length) leave()
    else { setShown(POST.length) }
  }

  return (
    <div
      className={`boot ${phase === 'leaving' ? 'boot-leaving' : ''}`}
      onClick={skip}
      onKeyDown={skip}
      role="presentation"
    >
      <div className="boot-scan" />
      {phase !== 'welcome' && phase !== 'leaving' ? (
        <pre className="boot-post">
          {POST.slice(0, shown).map((l, i) => (
            <div key={i} className={`boot-line${l.head ? ' head' : ''}${l.run ? ' run' : ''}`}>
              {l.head ? l.label : (
                <>
                  <span className="boot-label">{l.label}</span>
                  {l.ok && <span className="boot-ok">  [ OK ]</span>}
                  {l.run && <span className="boot-cursor">▍</span>}
                </>
              )}
            </div>
          ))}
        </pre>
      ) : (
        <div className="boot-welcome">
          <pre className="boot-logo">{
`███╗   ██╗ ██╗           ██╗
████╗  ██║ ██║           ██║
██╔██╗ ██║ ██║           ██║
██║╚██╗██║ ██║      ██   ██║
██║ ╚████║ ███████╗ ╚█████╔╝
╚═╝  ╚═══╝ ╚══════╝  ╚════╝ `
          }</pre>
          <div className="boot-tag">Noel Jackson · Systems &amp; AI Infrastructure Engineer</div>
          <div className="boot-welcome-sub">Welcome to nlj OS</div>
        </div>
      )}
      <div className="boot-skip">click anywhere to skip →</div>
    </div>
  )
}
