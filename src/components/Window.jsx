import { useRef } from 'react'
import { useOS } from '../store.js'
import { getApp } from '../apps.js'
import AppContent from './AppContent.jsx'

export default function Window({ win }) {
  const { close, focus, move, resize, toggleCollapse, toggleZoom } = useOS()
  const maxZ = useOS((s) => Math.max(...s.windows.map((w) => w.z)))
  const app = getApp(win.appId)
  const drag = useRef(null)
  const isActive = win.z === maxZ

  const beginMove = (e) => {
    focus(win.id)
    drag.current = {
      mode: 'move',
      startX: e.clientX, startY: e.clientY,
      origX: win.x, origY: win.y,
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const onTitleDown = (e) => {
    if (e.target.closest('.ctl')) return
    beginMove(e)
  }

  // chromeless drag — grab the shell, not any interactive bit
  const onShellDown = (e) => {
    focus(win.id)
    if (e.target.closest('button, canvas, iframe, input, a, .pet-screen, .bb-lcd')) return
    beginMove(e)
  }

  const onGrowDown = (e) => {
    e.stopPropagation()
    focus(win.id)
    drag.current = {
      mode: 'resize',
      startX: e.clientX, startY: e.clientY,
      origW: win.w, origH: win.h,
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const onMove = (e) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (d.mode === 'move') {
      move(win.id, Math.max(0, d.origX + dx), Math.max(22, d.origY + dy))
    } else {
      resize(win.id, Math.max(220, d.origW + dx), Math.max(140, d.origH + dy))
    }
  }

  const onUp = () => {
    drag.current = null
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }

  const stop = (fn) => (e) => {
    e.stopPropagation()
    fn()
  }

  // ── chromeless / egg windows ──
  if (app?.chromeless) {
    const controls = (
      <div className="egg-controls">
        <button className="egg-ctl min" title="Minimize" onClick={stop(() => toggleCollapse(win.id))} />
        <button className="egg-ctl close" title="Close" onClick={stop(() => close(win.id))} />
      </div>
    )
    if (win.collapsed) {
      return (
        <div
          className="window chromeless egg-min"
          style={{ left: win.x, top: win.y, zIndex: win.z }}
          onPointerDown={onShellDown}
        >
          {controls}
          <span className="egg-min-label">{win.title}</span>
        </div>
      )
    }
    return (
      <div
        className="window chromeless"
        style={{ left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z }}
        onPointerDown={onShellDown}
      >
        {controls}
        <AppContent app={app} />
      </div>
    )
  }

  return (
    <div
      className={`window ${isActive ? 'active' : ''} ${win.collapsed ? 'collapsed' : ''}`}
      style={{
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.collapsed ? 'auto' : win.h,
        zIndex: win.z,
      }}
      onPointerDown={() => focus(win.id)}
    >
      <div
        className="title-bar"
        onPointerDown={onTitleDown}
        onDoubleClick={(e) => {
          if (e.target.closest('.ctl')) return
          toggleCollapse(win.id) // classic window-shade
        }}
      >
        <div className="title-ctls left" />
        <div className="title-fill">
          <span className="title-text">{win.title}</span>
        </div>
        <div className="title-ctls right">
          <button
            className="ctl collapse"
            title="Minimize"
            onClick={stop(() => toggleCollapse(win.id))}
          />
          <button className="ctl zoom" title="Maximize" onClick={stop(() => toggleZoom(win.id))} />
          <button className="ctl close" title="Close" onClick={stop(() => close(win.id))} />
        </div>
      </div>
      <div className={`window-body ${app?.bleed ? 'bleed' : ''}`}>
        <AppContent app={app} />
      </div>
      <div className="grow-box" onPointerDown={onGrowDown} />
    </div>
  )
}
