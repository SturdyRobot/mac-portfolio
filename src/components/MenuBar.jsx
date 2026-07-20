import { Fragment, useEffect, useState } from 'react'
import { apps } from '../apps.js'
import { useOS } from '../store.js'
import { isMuted, toggleMute, playSound } from '../sound.js'

function Clock() {
  const [now, setNow] = useState('')
  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      )
    tick()
    const t = setInterval(tick, 10000)
    return () => clearInterval(t)
  }, [])
  return <span className="menu-clock">{now}</span>
}

const AppleLogo = () => (
  <svg width="14" height="16" viewBox="0 0 13 15" aria-label="Apple menu">
    <defs>
      <clipPath id="appleClip">
        <path d="M9.6 8c0-1.5 1.2-2.2 1.3-2.3-.7-1-1.8-1.2-2.2-1.2-.9-.1-1.8.5-2.3.5s-1.2-.5-2-.5c-1 0-2 .6-2.5 1.5-1.1 1.9-.3 4.6.8 6.1.5.7 1.1 1.5 1.9 1.5.8 0 1-.5 2-.5s1.1.5 2 .5c.8 0 1.3-.7 1.8-1.4.4-.6.6-1.2.6-1.2s-1.7-.6-1.7-2.5zM8.1 3.6c.4-.5.7-1.2.6-1.9-.6 0-1.4.4-1.8.9-.4.4-.7 1.1-.6 1.8.7.1 1.4-.3 1.8-.8z" />
      </clipPath>
    </defs>
    <g clipPath="url(#appleClip)">
      <rect x="0" y="0" width="13" height="2.6" fill="#61bb46" />
      <rect x="0" y="2.6" width="13" height="2.6" fill="#fdb827" />
      <rect x="0" y="5.2" width="13" height="2.6" fill="#f5821f" />
      <rect x="0" y="7.8" width="13" height="2.6" fill="#e03a3e" />
      <rect x="0" y="10.4" width="13" height="2.6" fill="#963d97" />
      <rect x="0" y="13" width="13" height="2.6" fill="#009ddc" />
    </g>
  </svg>
)

const renderIcon = (icon) =>
  typeof icon === 'function' ? icon({ size: 15 }) : icon

function MuteToggle() {
  const [m, setM] = useState(isMuted())
  return (
    <span
      className="menu-mute"
      title={m ? 'Sound off' : 'Sound on'}
      onClick={() => {
        const v = toggleMute()
        setM(v)
        if (!v) playSound('click') // little confirmation when turning on
      }}
    >
      {m ? '🔇' : '🔊'}
    </span>
  )
}

export default function MenuBar() {
  const [open, setOpen] = useState(null)
  const openApp = useOS((s) => s.openApp)
  const closeFront = useOS((s) => s.closeFront)
  const closeAll = useOS((s) => s.closeAll)
  const setPower = useOS((s) => s.setPower)
  const setIconSort = useOS((s) => s.setIconSort)
  const showDialog = useOS((s) => s.showDialog)
  const hasWindows = useOS((s) => s.windows.length > 0)

  const toggle = (name) => setOpen((m) => (m === name ? null : name))
  const run = (fn) => () => {
    playSound('select')
    fn()
    setOpen(null)
  }
  const exec = (cmd) => () => {
    try {
      document.execCommand(cmd)
    } catch {}
    setOpen(null)
  }

  const launchers = apps.filter((a) => a.menu)

  // group launchers by category, preserving first-seen order
  const cats = []
  const byCat = {}
  for (const a of launchers) {
    const c = a.category || 'Apps'
    if (!byCat[c]) {
      byCat[c] = []
      cats.push(c)
    }
    byCat[c].push(a)
  }

  const Row = ({ icon, label, onClick, disabled }) => (
    <div
      className={`menu-row ${disabled ? 'disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
    >
      {icon !== undefined && <span className="menu-row-icon">{renderIcon(icon)}</span>}
      {label}
    </div>
  )
  const Sep = () => <div className="menu-sep" />

  return (
    <div className="menubar" onMouseLeave={() => setOpen(null)}>
      {/* ── Apple ── */}
      <div className="menu-slot">
        <span
          className={`menu-item apple ${open === 'apple' ? 'active' : ''}`}
          onClick={() => toggle('apple')}
        >
          <AppleLogo />
        </span>
        {open === 'apple' && (
          <div className="menu-dropdown">
            <Row
              label="About This Macintosh…"
              onClick={run(() =>
                showDialog({
                  icon: '🖥',
                  title: 'Macintosh Portfolio',
                  body: 'System 8 · built from scratch by Sturdy Robot. Memory: ∞.',
                }),
              )}
            />
            <Sep />
            <Row icon="🎨" label="Control Panels" onClick={run(() => openApp('appearance'))} />
            {/* every app is launchable from up here, grouped by category */}
            {cats.map((c) => (
              <Fragment key={c}>
                <Sep />
                <div className="menu-label">{c}</div>
                {byCat[c].map((a) => (
                  <Row key={a.id} icon={a.icon} label={a.name} onClick={run(() => openApp(a.id))} />
                ))}
              </Fragment>
            ))}
          </div>
        )}
      </div>

      {/* ── File ── */}
      <div className="menu-slot">
        <span
          className={`menu-item ${open === 'file' ? 'active' : ''}`}
          onClick={() => toggle('file')}
        >
          File
        </span>
        {open === 'file' && (
          <div className="menu-dropdown">
            <Row label="Close Window" onClick={run(closeFront)} disabled={!hasWindows} />
            <Row label="Close All Windows" onClick={run(closeAll)} disabled={!hasWindows} />
          </div>
        )}
      </div>

      {/* ── Edit ── */}
      <div className="menu-slot">
        <span
          className={`menu-item ${open === 'edit' ? 'active' : ''}`}
          onClick={() => toggle('edit')}
        >
          Edit
        </span>
        {open === 'edit' && (
          <div className="menu-dropdown">
            <Row label="Undo" onClick={exec('undo')} />
            <Sep />
            <Row label="Cut" onClick={exec('cut')} />
            <Row label="Copy" onClick={exec('copy')} />
            <Row label="Paste" onClick={exec('paste')} />
            <Row label="Clear" onClick={exec('delete')} />
            <Sep />
            <Row label="Select All" onClick={exec('selectAll')} />
          </div>
        )}
      </div>

      {/* ── View ── */}
      <div className="menu-slot">
        <span
          className={`menu-item ${open === 'view' ? 'active' : ''}`}
          onClick={() => toggle('view')}
        >
          View
        </span>
        {open === 'view' && (
          <div className="menu-dropdown">
            <Row label="Clean Up Desktop" onClick={run(() => setIconSort('default'))} />
            <Sep />
            <Row label="Sort Icons by Name" onClick={run(() => setIconSort('name'))} />
            <Row label="Sort Icons by Kind" onClick={run(() => setIconSort('kind'))} />
            <Sep />
            <Row icon="🎨" label="Appearance…" onClick={run(() => openApp('appearance'))} />
          </div>
        )}
      </div>

      {/* ── Special ── */}
      <div className="menu-slot">
        <span
          className={`menu-item ${open === 'special' ? 'active' : ''}`}
          onClick={() => toggle('special')}
        >
          Special
        </span>
        {open === 'special' && (
          <div className="menu-dropdown">
            <Row
              label="Empty Trash…"
              onClick={run(() =>
                showDialog({ icon: '🗑', title: 'Trash', body: 'The Trash is empty.' }),
              )}
            />
            <Sep />
            <Row label="Sleep" onClick={run(() => setPower('sleep'))} />
            <Row label="Restart" onClick={run(() => window.location.reload())} />
            <Row label="Shut Down" onClick={run(() => setPower('off'))} />
          </div>
        )}
      </div>

      <div className="menu-right">
        <MuteToggle />
        <Clock />
      </div>
    </div>
  )
}
