import { useEffect, useRef, useState } from 'react'

// ═══════════════════════════════════════════════════════════════════
//  TAMACHU — a Tamagotchi-style virtual pet (a Pokémon-spoof pixel
//  electric-mouse) with three mini-games. Winning raises happiness.
//  State persists to localStorage so the pet keeps living.
// ═══════════════════════════════════════════════════════════════════

const GRID = 16
const PAL = {
  o: '#2a2320', Y: '#f6c700', k: '#2a2320', r: '#ff5b6e', w: '#f2e9d0', W: '#c9a24a',
}

const HAPPY = [
  '...oo......oo...', '...YY......YY...', '...YY......YY...', '..oYYo....oYYo..',
  '.oYYYYYYYYYYYYo.', '.oYYYYYYYYYYYYo.', '.oYYYYYYYYYYYYo.', '.oYYkYYYYYYkYYo.',
  '.oYYkYYYYYYkYYo.', '.oYrYYYYYYYYrYo.', '.oYYYYYooYYYYYo.', '.oYYYYYYYYYYYYo.',
  '..oYYYYYYYYYYo..', '...oYYYYYYYYo...', '....oooooooo....', '................',
]
const SLEEP = HAPPY.map((row, i) =>
  i === 7 ? '.oYYoYYYYYYoYYo.' : i === 8 ? '.oYYYYYYYYYYYYo.' : row)
const SAD = HAPPY.map((row, i) => (i === 10 ? '.oYYoYYYYYYoYYo.' : row))
const EGG = [
  '.....oooo.......', '...oowwwwoo.....', '..owwwwwwwwo....', '.owwwwwwwwwwo...',
  '.owwwwWWwwwwo...', 'owwwwwwwwwwwwo..', 'owwwWWwwwwwwwo..', 'owwwwwwwwWWwwo..',
  'owwwwwwwwwwwwo..', 'owwWWwwwwwwwwo..', '.owwwwwwwWWwwo..', '.owwwwwwwwwwo...',
  '..owwwwwwwwo....', '...oowwwwoo.....', '.....oooo.......', '................',
]

const KEY = 'tamachu-pet'
const TICK = 4000
const clamp = (n) => Math.max(0, Math.min(100, n))
const clampN = (n, a, b) => Math.max(a, Math.min(b, n))
const GAMES = [
  { id: 'guess', name: 'GUESS' },
  { id: 'catch', name: 'CATCH' },
  { id: 'tap', name: 'TAP' },
]

function freshPet() {
  return {
    stage: 'egg', name: 'Sparky',
    hunger: 80, happy: 80, energy: 80, clean: 100,
    age: 0, feeds: 0, asleep: false, poop: false, sick: false, react: null,
  }
}
function loadPet() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return freshPet()
    const p = JSON.parse(raw)
    const elapsed = Math.min(240, Math.floor((Date.now() - (p.lastSeen || Date.now())) / TICK))
    if (p.stage !== 'egg' && !p.asleep && elapsed > 0) {
      p.hunger = clamp(p.hunger - elapsed * 2)
      p.happy = clamp(p.happy - elapsed * 1.5)
      p.energy = clamp(p.energy - elapsed)
    }
    return { ...freshPet(), ...p }
  } catch {
    return freshPet()
  }
}
function stepPet(p) {
  let { hunger, happy, energy, clean, age, asleep, poop, sick, stage, feeds } = p
  age += 1
  if (stage === 'egg') {
    if (feeds >= 3 || age >= 10) return { ...p, age, stage: 'pet', happy: 90, react: '✦ hatched!' }
    return { ...p, age }
  }
  if (asleep) {
    energy = clamp(energy + 6); hunger = clamp(hunger - 1)
    if (energy >= 100) asleep = false
  } else {
    hunger = clamp(hunger - 3); happy = clamp(happy - 2); energy = clamp(energy - 2)
  }
  if (!poop && Math.random() < 0.14) poop = true
  if (poop) clean = clamp(clean - 5)
  if ((hunger <= 0 || clean <= 0) && !sick && Math.random() < 0.35) sick = true
  if (sick) happy = clamp(happy - 2)
  return { ...p, hunger, happy, energy, clean, age, asleep, poop, sick, stage, feeds }
}
function spriteFor(p) {
  if (p.stage === 'egg') return EGG
  if (p.asleep) return SLEEP
  if (p.sick || p.happy < 25 || p.hunger < 20) return SAD
  return HAPPY
}

// Defined at module scope (stable identity) so they are never remounted —
// a re-render mid-click (e.g. from focus()) would otherwise drop the click.
function Meter({ icon, v }) {
  return (
    <div className="pet-meter" title={Math.round(v) + '%'}>
      <span className="pet-meter-ic">{icon}</span>
      <span className="pet-meter-track">
        <span className="pet-meter-fill" style={{ width: `${v}%` }} />
      </span>
    </div>
  )
}
function Btn({ ic, label, onClick, onDown, onUp, disabled }) {
  const hold = onDown || onUp
  const h = hold
    ? {
        onPointerDown: (e) => { e.preventDefault(); onDown && onDown() },
        onPointerUp: () => onUp && onUp(),
        onPointerLeave: () => onUp && onUp(),
      }
    : { onClick }
  return (
    <button className="pet-btn" disabled={disabled} {...h}>
      <b>{ic}</b>
      {label}
    </button>
  )
}

export default function PixelPet() {
  const [pet, setPet] = useState(loadPet)
  const [view, setView] = useState('pet') // pet | menu | game
  const [menuSel, setMenuSel] = useState(0)
  const [, bump] = useState(0)
  const rerender = () => bump((n) => n + 1)

  const petRef = useRef(pet); petRef.current = pet
  const viewRef = useRef(view); viewRef.current = view
  const game = useRef(null)
  const canvas = useRef(null)

  // decay timer
  useEffect(() => {
    const id = setInterval(() => setPet((p) => stepPet(p)), TICK)
    return () => clearInterval(id)
  }, [])
  // persist
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ ...pet, lastSeen: Date.now() })) } catch {}
  }, [pet])
  // clear reaction
  useEffect(() => {
    if (!pet.react) return
    const t = setTimeout(() => setPet((p) => ({ ...p, react: null })), 1600)
    return () => clearTimeout(t)
  }, [pet.react])

  // ── render + game loop ──
  useEffect(() => {
    const cv = canvas.current
    const ctx = cv.getContext('2d')
    let raf, lastT = 0
    const loop = (t) => {
      raf = requestAnimationFrame(loop)
      const size = cv.clientWidth
      const dpr = window.devicePixelRatio || 1
      cv.width = size * dpr; cv.height = size * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size, size)
      ctx.imageSmoothingEnabled = false
      const cell = size / GRID
      const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0
      lastT = t
      if (viewRef.current === 'game' && game.current) {
        updateGame(dt); drawGame(ctx, cell, t)
      } else {
        drawCreature(ctx, cell, t)
      }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const drawSprite = (ctx, sprite, cell, ox, oy) => {
    sprite.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const c = PAL[row[x]]
        if (!c) continue
        ctx.fillStyle = c
        ctx.fillRect((ox + x) * cell, (oy + y) * cell, cell + 0.5, cell + 0.5)
      }
    })
  }
  const drawCreature = (ctx, cell, t) => {
    const p = petRef.current
    const sprite = spriteFor(p)
    const bounce = p.stage === 'egg' ? 0 : Math.floor(t / 450) % 2
    drawSprite(ctx, sprite, cell, 0, -bounce)
    if (p.poop) {
      ctx.fillStyle = '#7a4a1e'
      ctx.fillRect(1.5 * cell, 14 * cell, cell * 2, cell)
      ctx.fillRect(2 * cell, 13 * cell, cell, cell)
    }
    if (p.asleep) {
      ctx.fillStyle = '#5b6b8a'
      ctx.font = `${Math.round(cell * 2)}px monospace`
      ctx.fillText('z', 12 * cell, 4 * cell); ctx.fillText('z', 13.4 * cell, 2.6 * cell)
    }
  }
  const text = (ctx, s, x, y, size, col = '#3a3140', align = 'center') => {
    ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = 'middle'
    ctx.font = `bold ${size}px monospace`; ctx.fillText(s, x, y)
    ctx.textAlign = 'left'
  }
  const drawGame = (ctx, cell, t) => {
    const g = game.current
    const S = GRID * cell
    if (g.over) {
      text(ctx, g.over.win ? 'YOU WIN!' : 'GAME OVER', S / 2, S * 0.36, cell * 1.6, g.over.win ? '#1f9d4d' : '#b03a3a')
      text(ctx, g.over.msg, S / 2, S * 0.52, cell * 1.1)
      if (g.over.reward > 0) text(ctx, '+' + g.over.reward + ' ♥', S / 2, S * 0.66, cell * 1.2, '#e0407a')
      return
    }
    if (g.id === 'guess') {
      text(ctx, 'ROUND ' + g.round + '/3', S / 2, cell * 1.6, cell)
      // score dots
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < g.score ? '#1f9d4d' : '#b9c2a8'
        ctx.fillRect((5.5 + i * 1.8) * cell, 3 * cell, cell, cell)
      }
      if (g.reveal) {
        text(ctx, g.reveal.actual === 0 ? '◀' : '▶', S / 2, S * 0.55, cell * 4,
          g.reveal.correct ? '#1f9d4d' : '#b03a3a')
        text(ctx, g.reveal.correct ? '✓' : '✗', S / 2, S * 0.82, cell * 1.6,
          g.reveal.correct ? '#1f9d4d' : '#b03a3a')
      } else {
        text(ctx, 'which way?', S / 2, S * 0.5, cell * 1.1)
        text(ctx, '◀   ▶', S / 2, S * 0.68, cell * 2)
      }
    } else if (g.id === 'catch') {
      text(ctx, 'CAUGHT ' + g.caught + '/' + g.max, S / 2, cell * 1.4, cell)
      // items (hearts)
      ctx.fillStyle = '#e0407a'
      g.items.forEach((it) => ctx.fillRect(it.x * cell, it.y * cell, cell * 1.4, cell * 1.4))
      // basket
      ctx.fillStyle = '#5a3a1e'
      ctx.fillRect((g.basketX - 1.4) * cell, 13.4 * cell, cell * 2.8, cell * 1.4)
    } else if (g.id === 'tap') {
      text(ctx, 'HITS ' + g.hits + '/3', S / 2, cell * 1.4, cell)
      // bar
      ctx.fillStyle = '#b9c2a8'; ctx.fillRect(cell, S * 0.55, S - 2 * cell, cell * 1.6)
      ctx.fillStyle = '#8fd6a0'; ctx.fillRect(6.5 * cell, S * 0.55, 3 * cell, cell * 1.6) // zone
      ctx.fillStyle = '#2a2320'; ctx.fillRect(g.pos * cell, S * 0.5, cell * 0.7, cell * 2.4) // marker
      text(ctx, 'tap in the green!', S / 2, S * 0.8, cell)
    }
  }

  const updateGame = (dt) => {
    const g = game.current
    if (!g || g.over) return
    if (g.id === 'catch') {
      g.basketX = clampN(g.basketX + g.dir * 11 * dt, 1.4, 14.6)
      g.spawn += dt
      if (g.total < g.max && g.spawn > 0.75) {
        g.spawn = 0; g.items.push({ x: 1 + Math.random() * 12.5, y: -1.5 }); g.total++
      }
      g.items.forEach((it) => (it.y += 5.2 * dt))
      g.items = g.items.filter((it) => {
        if (it.y >= 13) { if (Math.abs(it.x - g.basketX) <= 1.5) g.caught++; return false }
        return true
      })
      if (g.total >= g.max && g.items.length === 0) endCatch()
    } else if (g.id === 'tap') {
      g.pos += g.dir * 11 * dt
      if (g.pos > 14) { g.pos = 14; g.dir = -1 }
      if (g.pos < 1) { g.pos = 1; g.dir = 1 }
    }
  }

  // ── actions ──
  const reactP = (msg, extra) => setPet((p) => ({ ...p, react: msg, ...extra }))
  const feed = () => setPet((p) =>
    p.stage === 'egg'
      ? { ...p, react: '♥ warmed', feeds: p.feeds + 1 }
      : { ...p, react: '😋 yum', hunger: clamp(p.hunger + 28), happy: clamp(p.happy + 4) })
  const cleanUp = () => setPet((p) => ({ ...p, react: '✨ clean', poop: false, clean: 100 }))
  const sleep = () => setPet((p) => (p.stage === 'egg' ? p : { ...p, react: p.asleep ? '☀' : '💤', asleep: !p.asleep }))
  const heal = () => setPet((p) => ({ ...p, react: '💊 better', sick: false, happy: clamp(p.happy + 10) }))

  const openGames = () => {
    const p = petRef.current
    if (p.stage === 'egg') return reactP('…')
    if (p.energy < 15) return reactP('😩 tired')
    setMenuSel(0); setView('menu')
  }
  const startGame = (id) => {
    if (id === 'guess') game.current = { id, round: 1, score: 0, reveal: null, over: null }
    if (id === 'catch') game.current = { id, basketX: 7.5, dir: 0, items: [], caught: 0, total: 0, max: 12, spawn: 0, over: null }
    if (id === 'tap') game.current = { id, pos: 1, dir: 1, tries: 0, hits: 0, over: null }
    setView('game'); rerender()
  }
  const finish = (win, reward, cost, msg) => {
    game.current.over = { win, reward, msg }
    setPet((p) => ({ ...p, happy: clamp(p.happy + reward), energy: clamp(p.energy - cost) }))
    rerender()
  }
  const endCatch = () => {
    const g = game.current
    finish(g.caught >= g.max / 2, Math.round((g.caught / g.max) * 30), 10, g.caught + ' caught')
  }
  // guess input
  const guess = (dir) => {
    const g = game.current
    if (g.reveal || g.over) return
    const actual = Math.random() < 0.5 ? 0 : 1
    const correct = dir === actual
    if (correct) g.score++
    g.reveal = { guess: dir, actual, correct }
    rerender()
    setTimeout(() => {
      g.reveal = null
      if (g.round >= 3) finish(g.score >= 2, g.score >= 2 ? 26 : 8, 8, g.score + '/3 right')
      else { g.round++; rerender() }
    }, 950)
  }
  // tap input
  const tap = () => {
    const g = game.current
    if (g.over) return
    g.tries++
    if (g.pos >= 6.5 && g.pos <= 9.5) g.hits++
    if (g.tries >= 3) finish(g.hits >= 2, g.hits * 9, 6, g.hits + '/3 hits')
    else rerender()
  }
  const backToPet = () => { game.current = null; setView('pet') }

  const stageLabel = pet.stage === 'egg' ? 'Egg' : pet.sick ? 'Sick!' : pet.asleep ? 'Asleep' : 'Happy'

  // buttons depend on the current view
  let buttons
  if (view === 'menu') {
    buttons = [
      { ic: '◀', label: '', onClick: () => setMenuSel((s) => (s - 1 + GAMES.length) % GAMES.length) },
      { ic: '▶', label: '', onClick: () => setMenuSel((s) => (s + 1) % GAMES.length) },
      { ic: '🅰', label: 'Play', onClick: () => startGame(GAMES[menuSel].id) },
      { ic: '✕', label: 'Back', onClick: () => setView('pet') },
    ]
  } else if (view === 'game') {
    const g = game.current
    if (g?.over) buttons = [{ ic: '✓', label: 'OK', onClick: backToPet }]
    else if (g?.id === 'guess') buttons = [
      { ic: '◀', label: 'Left', onClick: () => guess(0) },
      { ic: '▶', label: 'Right', onClick: () => guess(1) },
      { ic: '✕', label: 'Quit', onClick: backToPet },
    ]
    else if (g?.id === 'catch') buttons = [
      { ic: '◀', label: '', onDown: () => (g.dir = -1), onUp: () => (g.dir = 0) },
      { ic: '▶', label: '', onDown: () => (g.dir = 1), onUp: () => (g.dir = 0) },
      { ic: '✕', label: 'Quit', onClick: backToPet },
    ]
    else buttons = [
      { ic: '🅰', label: 'Tap!', onClick: tap },
      { ic: '✕', label: 'Quit', onClick: backToPet },
    ]
  } else {
    buttons = [
      { ic: '🍎', label: 'Feed', onClick: feed },
      { ic: '🎮', label: 'Games', onClick: openGames },
      { ic: '🧼', label: 'Clean', onClick: cleanUp },
      pet.sick
        ? { ic: '💊', label: 'Heal', onClick: heal }
        : { ic: pet.asleep ? '☀️' : '💤', label: pet.asleep ? 'Wake' : 'Sleep', onClick: sleep },
    ]
  }

  return (
    <div className="pet">
      <div className="pet-brand">⚡ TAMACHU ⚡</div>
      <div className="pet-meters">
        <Meter icon="🍖" v={pet.hunger} />
        <Meter icon="⚡" v={pet.energy} />
        <Meter icon="😊" v={pet.happy} />
      </div>

      <div className="pet-screen">
        <canvas ref={canvas} className="pet-canvas" />
        {pet.react && view === 'pet' && <div className="pet-react">{pet.react}</div>}
        {view === 'menu' && (
          <div className="pet-menu-ov">
            <div className="pet-menu-title">▶ MINI-GAMES</div>
            {GAMES.map((gm, i) => (
              <div key={gm.id} className={`pet-menu-row ${i === menuSel ? 'sel' : ''}`}>{gm.name}</div>
            ))}
            <div className="pet-menu-hint">◀▶ pick · 🅰 play</div>
          </div>
        )}
      </div>

      <div className="pet-name">
        {view === 'game' ? 'Playing…' : <>{pet.name} · <span className="pet-stage">{stageLabel}</span></>}
      </div>

      <div className="pet-buttons">
        {buttons.map((b, i) => <Btn key={i} {...b} />)}
      </div>
    </div>
  )
}
