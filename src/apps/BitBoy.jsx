import { useRef, useState, useEffect } from 'react'
import { bitboyGames } from '../bitboyGames.js'

// Map a control to a keyboard key we forward into the game.
const KEYMAP = {
  up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
  a: 'Enter', b: 'x', start: 'Enter', select: 'Shift',
}

export default function BitBoy() {
  const [game, setGame] = useState(null) // null = cartridge menu
  const [sel, setSel] = useState(0)
  const frame = useRef(null)
  const rootRef = useRef(null)

  // Fire a synthetic key event inside the game's iframe.
  const sendKey = (key, type) => {
    const w = frame.current?.contentWindow
    if (!w) return
    try {
      const ev = new w.KeyboardEvent(type, { key, bubbles: true })
      w.document.dispatchEvent(ev)
    } catch {}
  }

  const launch = (g) => {
    setGame(g)
    // focus the iframe shortly after it mounts so hardware keys work too
    setTimeout(() => frame.current?.contentWindow?.focus(), 60)
  }

  const press = (action) => {
    if (!game) {
      // navigating the cartridge menu
      if (action === 'up') setSel((s) => (s - 1 + bitboyGames.length) % bitboyGames.length)
      else if (action === 'down') setSel((s) => (s + 1) % bitboyGames.length)
      else if (action === 'a' || action === 'start') {
        if (bitboyGames[sel]) launch(bitboyGames[sel])
      }
      return
    }
    sendKey(KEYMAP[action], 'keydown')
  }
  const release = (action) => {
    if (game) sendKey(KEYMAP[action], 'keyup')
  }

  // Real keyboard → forward into the game (or drive the menu).
  // Attached to the device div + tabIndex, so it only fires when the
  // BitBoy has focus — it won't hijack keys from other windows.
  const handleKey = (e) => {
    const k = e.key
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(k)) {
      e.preventDefault()
    }
    if (game) {
      sendKey(k, e.type) // e.type is 'keydown' or 'keyup'
    } else if (e.type === 'keydown') {
      if (k === 'ArrowUp') press('up')
      else if (k === 'ArrowDown') press('down')
      else if (k === 'Enter' || k === ' ' || k === 'x') press('a')
    }
  }

  // focus the device when it opens so keys work right away
  useEffect(() => {
    rootRef.current?.focus()
  }, [])

  // helper to wire a control button
  const ctl = (action, className, label) => (
    <button
      className={className}
      onPointerDown={(e) => { e.preventDefault(); press(action) }}
      onPointerUp={() => release(action)}
      onPointerLeave={() => release(action)}
    >
      {label}
    </button>
  )

  return (
    <div
      className="bitboy"
      ref={rootRef}
      tabIndex={0}
      onKeyDown={handleKey}
      onKeyUp={handleKey}
    >
      {/* screen housing */}
      <div className="bb-housing">
        <div className="bb-screentop">
          <span className="bb-led" /> POWER
          <span className="bb-screentop-r">DOT-MATRIX SYSTEM</span>
        </div>

        <div className="bb-lcd">
          {game ? (
            <iframe
              ref={frame}
              className="bb-game"
              src={game.src}
              title={game.name}
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <div className="bb-menu">
              <div className="bb-menu-title">▶ SELECT GAME</div>
              {bitboyGames.length === 0 && (
                <div className="bb-nocart">NO CARTRIDGE</div>
              )}
              {bitboyGames.map((g, i) => (
                <div
                  key={g.id}
                  className={`bb-menu-item ${i === sel ? 'sel' : ''}`}
                  onClick={() => { setSel(i); launch(g) }}
                >
                  <span className="bb-cart-dot" style={{ background: g.color || '#8ad' }} />
                  {g.name}
                </div>
              ))}
              <div className="bb-menu-hint">▲▼ move · A start</div>
            </div>
          )}
        </div>

        <div className="bb-brand">BitBoy</div>
      </div>

      {/* menu / eject */}
      <div className="bb-eject-row">
        {game && (
          <button className="bb-eject" onClick={() => setGame(null)}>◀ CARTRIDGES</button>
        )}
      </div>

      {/* controls */}
      <div className="bb-controls">
        <div className="bb-dpad">
          {ctl('up', 'bb-d bb-up', '▲')}
          {ctl('left', 'bb-d bb-left', '◀')}
          <span className="bb-d bb-hub" />
          {ctl('right', 'bb-d bb-right', '▶')}
          {ctl('down', 'bb-d bb-down', '▼')}
        </div>

        <div className="bb-ab">
          {ctl('b', 'bb-btn bb-b', 'B')}
          {ctl('a', 'bb-btn bb-a', 'A')}
        </div>
      </div>

      <div className="bb-startsel">
        {ctl('select', 'bb-pill', 'SELECT')}
        {ctl('start', 'bb-pill', 'START')}
      </div>

      <div className="bb-speaker">
        <span /><span /><span /><span /><span /><span />
      </div>
    </div>
  )
}
