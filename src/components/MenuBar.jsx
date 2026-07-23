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

// The corner logo — a robot, not an apple. This is Sturdy Robot OS.
const RobotLogo = () => (
  <span aria-label="Sturdy Robot menu" style={{ fontSize: 15, lineHeight: 1 }}>🤖</span>
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
  const [openCat, setOpenCat] = useState(null)
  const openApp = useOS((s) => s.openApp)
  const closeFront = useOS((s) => s.closeFront)
  const closeAll = useOS((s) => s.closeAll)
  const setPower = useOS((s) => s.setPower)
  const setIconSort = useOS((s) => s.setIconSort)
  const showDialog = useOS((s) => s.showDialog)
  const hasWindows = useOS((s) => s.windows.length > 0)

  const toggle = (name) => setOpen((m) => (m === name ? null : name))
  // fold every category back up whenever the Apple menu isn't the one open,
  // so you never come back to a wall of a hundred items
  useEffect(() => {
    if (open !== 'apple') setOpenCat(null)
  }, [open])
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
          <RobotLogo />
        </span>
        {open === 'apple' && (
          <div className="menu-dropdown">
            <Row
              label="About This Computer…"
              onClick={run(() =>
                showDialog({
                  icon: '🤖',
                  title: 'Sturdy Robot OS',
                  body: 'System 8 · built from scratch by Sturdy Robot. Memory: ∞.',
                }),
              )}
            />
            <Sep />
            <Row icon="🎨" label="Control Panels" onClick={run(() => openApp('appearance'))} />
            {/* categories start folded — click one to open it, so the menu
                stays short instead of dumping every app at once */}
            {cats.map((c) => (
              <Fragment key={c}>
                <Sep />
                <div
                  className={`menu-label menu-cat ${openCat === c ? 'expanded' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    playSound('click')
                    setOpenCat((o) => (o === c ? null : c))
                  }}
                >
                  <span className="menu-cat-caret">{openCat === c ? '▾' : '▸'}</span>
                  {c}
                  <span className="menu-cat-count">{byCat[c].length}</span>
                </div>
                {openCat === c &&
                  byCat[c].map((a) => (
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
