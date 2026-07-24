import { useEffect, useMemo, useRef, useState } from 'react'
import { useOS } from '../store.js'
import { downloadResume } from '../apps/hire/resume.js'
import './palette.css'

// ⌘K / Ctrl+K command palette — instant navigation across both layers.
// Opening/closing + the ⌘K shortcut are driven from App; this renders the UI.
export default function CommandPalette() {
  const open = useOS((s) => s.palette)
  const close = useOS((s) => s.closePalette)
  const os = useOS((s) => s.os)
  const launchOS = useOS((s) => s.launchOS)
  const exitOS = useOS((s) => s.exitOS)
  const openApp = useOS((s) => s.openApp)
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const inputRef = useRef(null)

  const openInOS = (id) => () => { if (!os) launchOS(); openApp(id) }

  const actions = useMemo(() => {
    const list = [
      os
        ? { icon: '⎋', label: 'Exit to landing', hint: 'Executive surface', run: exitOS }
        : { icon: '⚡', label: 'Launch NLJ OS', hint: 'Workstation', run: launchOS },
      { icon: '>_', label: 'Open Terminal', hint: 'NLJ-CLI · real engine', run: openInOS('terminal') },
      { icon: '🦀', label: 'Open Kedge', hint: 'Shadow-Guard demo', run: openInOS('kedge') },
      { icon: '🤝', label: 'Hire Me', hint: 'interview + live engine', run: openInOS('scope') },
      { icon: '🌍', label: 'WorldFrame', hint: 'shipped desktop app', run: openInOS('worldframe') },
      { icon: '🐙', label: 'All Projects', hint: 'GitHub-style hub', run: openInOS('hub') },
      { icon: '✉', label: 'Contact — noel@nlj.dev', hint: 'email', run: () => { window.location.href = 'mailto:noel@nlj.dev' } },
      { icon: '📄', label: 'Download Résumé (PDF)', hint: 'one-page', run: () => downloadResume() },
      { icon: '↗', label: 'GitHub @nlj3', hint: 'source', run: () => window.open('https://github.com/nlj3', '_blank', 'noopener') },
    ]
    return list
  }, [os, exitOS, launchOS]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return actions
    return actions.filter((a) => (a.label + ' ' + (a.hint || '')).toLowerCase().includes(s))
  }, [q, actions])

  useEffect(() => { if (open) { setQ(''); setI(0); setTimeout(() => inputRef.current?.focus(), 30) } }, [open])
  useEffect(() => { if (i >= filtered.length) setI(0) }, [filtered.length]) // eslint-disable-line

  if (!open) return null

  const run = (a) => { close(); a.run() }

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setI((n) => Math.min(filtered.length - 1, n + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setI((n) => Math.max(0, n - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[i]) run(filtered[i]) }
  }

  return (
    <div className="cmdk-overlay" onClick={close}>
      <div className="cmdk" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-input-row">
          <span className="cmdk-prompt">⌘K</span>
          <input
            ref={inputRef}
            className="cmdk-input"
            placeholder="Jump to anything…"
            value={q}
            spellCheck={false}
            onChange={(e) => { setQ(e.target.value); setI(0) }}
            onKeyDown={onKey}
          />
          <span className="cmdk-esc">esc</span>
        </div>
        <div className="cmdk-list">
          {filtered.length === 0 && <div className="cmdk-empty">No matches</div>}
          {filtered.map((a, k) => (
            <button
              key={a.label}
              className={`cmdk-item${k === i ? ' on' : ''}`}
              onMouseEnter={() => setI(k)}
              onClick={() => run(a)}
            >
              <span className="cmdk-icon">{a.icon}</span>
              <span className="cmdk-label">{a.label}</span>
              {a.hint && <span className="cmdk-hint">{a.hint}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
