import { useEffect, useRef, useState } from 'react'
import { playSound } from '../sound.js'

// ═══════════════════════════════════════════════════════════════════
//  TAMACHU — a full Tamagotchi-style virtual pet.
//  • Life cycle: egg → baby → child → teen → adult (2 forms)
//  • The adult it becomes depends on how well you cared for it
//  • Hunger / happiness / energy / weight / discipline / age
//  • Meal vs snack, poop & cleaning, sickness & medicine, sleep
//  • Attention calls, scolding, care-mistakes, old age, death & rebirth
//  • 3 mini-games, a stats screen, saved to localStorage across visits
// ═══════════════════════════════════════════════════════════════════

const GRID = 16
const PAL = {
  o: '#2a2320', Y: '#f6c700', k: '#2a2320', r: '#ff5b6e',
  w: '#f2e9d0', W: '#c9a24a', g: '#8fd6a0',
}

// ── 16×16 sprites, one glyph per pixel ('.' = transparent) ──
const EGG = [
  '.....oooo.......', '...oowwwwoo.....', '..owwwwwwwwo....', '.owwwwwwwwwwo...',
  '.owwwwWWwwwwo...', 'owwwwwwwwwwwwo..', 'owwwWWwwwwwwwo..', 'owwwwwwwwWWwwo..',
  'owwwwwwwwwwwwo..', 'owwWWwwwwwwwwo..', '.owwwwwwwWWwwo..', '.owwwwwwwwwwo...',
  '..owwwwwwwwo....', '...oowwwwoo.....', '.....oooo.......', '................',
]
const BABY = [
  '................', '................', '................', '.......oo.......',
  '......oYYo......', '.....oYYYYo.....', '....oYYYYYYo....', '....oYkYYkYo....',
  '....oYYYYYYo....', '....oYrYYrYo....', '....oYYooYYo....', '.....oYYYYo.....',
  '......oooo......', '................', '................', '................',
]
const CHILD = [
  '................', '.....o....o.....', '.....Y....Y.....', '....oYo..oYo....',
  '....oYYooYYo....', '...oYYYYYYYYo...', '...oYYYYYYYYo...', '...oYkYYYYkYo...',
  '...oYkYYYYkYo...', '...oYrYYYYrYo...', '...oYYYooYYYo...', '...oYYYYYYYYo...',
  '....oYYYYYYo....', '.....oooooo.....', '................', '................',
]
const TEEN = [
  '................', '....o......o....', '....Y......Y....', '....Y......Y....',
  '...oYo....oYo...', '...oYYooooYYo...', '..oYYYYYYYYYYo..', '..oYYYYYYYYYYo..',
  '..oYkYYYYYYkYo..', '..oYkYYYYYYkYo..', '..oYrYYYYYYrYo..', '..oYYYYooYYYYo..',
  '..oYYYYYYYYYYo..', '...oYYYYYYYYo...', '....oooooooo....', '................',
]
const ADULT_GOOD = [
  '...oo......oo...', '...YY......YY...', '...YY......YY...', '..oYYo....oYYo..',
  '.oYYYYYYYYYYYYo.', '.oYYYYYYYYYYYYo.', '.oYYYYYYYYYYYYo.', '.oYYkYYYYYYkYYo.',
  '.oYYkYYYYYYkYYo.', '.oYrYYYYYYYYrYo.', '.oYYYYYooYYYYYo.', '.oYYYYYYYYYYYYo.',
  '..oYYYYYYYYYYo..', '...oYYYYYYYYo...', '....oooooooo....', '................',
]
const ADULT_BAD = [
  '...o.......o....', '...Yo......oY...', '...YY......YY...', '..oYYo....oYYo..',
  '.oYYYYYYYYYYYYo.', '.oYYYYYYYYYYYYo.', '.oYkkYYYYYYkkYo.', '.oYYYkYYYYkYYYo.',
  '.oYrYYYYYYYYrYo.', '.oYYYoooooooYYo.', '.oYYYYYYYYYYYYo.', '..oYYYYYYYYYYo..',
  '...oYYYYYYYYo...', '....oooooooo....', '................', '................',
]

const KEY = 'tamachu-pet'
const TICK = 12000 // ms per life tick — slow, passive heartbeat
const clamp = (n) => Math.max(0, Math.min(100, n))
const clampN = (n, a, b) => Math.max(a, Math.min(b, n))
const hearts = (v) => Math.max(0, Math.min(4, Math.ceil(v / 25)))
const heartStr = (v) => '●'.repeat(hearts(v)) + '○'.repeat(4 - hearts(v))
const TICKS_PER_DAY = 20
const baseWeight = (stage) =>
  ({ egg: 5, baby: 8, child: 16, teen: 26, adult: 34 })[stage] ?? 8
const STAGE_LEN = { egg: 5, baby: 14, child: 26, teen: 40 } // ticks per stage
const ADULT_LIFE = 900 // very long — old age is rare, never from neglect

const GAMES = [
  { id: 'guess', name: 'GUESS' },
  { id: 'catch', name: 'CATCH' },
  { id: 'tap', name: 'TAP' },
]

function freshEgg(generation = 1) {
  return {
    stage: 'egg', form: 'good', name: 'Sparky', generation,
    ticks: 0, stageAge: 0,
    hunger: 80, happy: 80, energy: 80, clean: 100,
    weight: 5, discipline: 20, careMistakes: 0,
    asleep: false, poopCount: 0, sick: false, sickTicks: 0, dead: false,
    calling: false, callReason: null, callTicks: 0, react: null,
  }
}
function loadPet() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return freshEgg(1)
    const p = { ...freshEgg(1), ...JSON.parse(raw) }
    const elapsed = Math.min(100, Math.floor((Date.now() - (p.lastSeen || Date.now())) / TICK))
    if (!p.dead && elapsed > 0) {
      if (p.stage !== 'egg' && !p.asleep) {
        p.hunger = clamp(p.hunger - elapsed * 0.5)
        p.happy = clamp(p.happy - elapsed * 0.4)
        p.energy = clamp(p.energy - elapsed * 0.35)
      }
      p.ticks += elapsed
      p.stageAge += elapsed // keeps quietly growing while you're away
    }
    return p
  } catch {
    return freshEgg(1)
  }
}

function stepPet(p) {
  if (p.dead) return p
  const s = { ...p }
  s.ticks++; s.stageAge++

  if (s.stage === 'egg') {
    if (s.stageAge >= STAGE_LEN.egg) {
      s.stage = 'baby'; s.stageAge = 0; s.happy = 90; s.weight = baseWeight('baby'); s.react = '✦ hatched!'
    }
    return s
  }

  // decay — gentle, so it's a passive companion
  if (s.asleep) {
    s.energy = clamp(s.energy + 8); s.hunger = clamp(s.hunger - 0.4)
    if (s.energy >= 100) s.asleep = false
  } else {
    s.hunger = clamp(s.hunger - 1)
    s.happy = clamp(s.happy - 0.8)
    s.energy = clamp(s.energy - 0.8)
    if (s.ticks % 5 === 0) s.weight = Math.max(baseWeight(s.stage), s.weight - 1)
    if (Math.random() < 0.06) s.poopCount = Math.min(4, s.poopCount + 1)
  }
  if (s.poopCount > 0) s.clean = clamp(s.clean - 3 * s.poopCount)

  // sickness — rare, and it never kills
  const dirty = s.poopCount >= 3
  if (!s.sick && (s.hunger <= 0 || dirty) && Math.random() < 0.05) s.sick = true
  if (s.sick) { s.sickTicks++; s.happy = clamp(s.happy - 1) }
  else s.sickTicks = 0

  // attention calls
  const need = s.sick ? 'sick'
    : s.hunger < 18 ? 'hungry'
    : s.poopCount >= 2 ? 'dirty'
    : s.happy < 18 ? 'sad'
    : s.energy < 10 ? 'sleepy'
    : null
  if (need) {
    s.calling = true
    s.callTicks = s.callReason === need ? s.callTicks + 1 : 1
    s.callReason = need
  } else if (s.calling && s.callReason === 'misbehave') {
    s.callTicks++
  } else if (!s.calling && !s.asleep && Math.random() < 0.015) {
    s.calling = true; s.callReason = 'misbehave'; s.callTicks = 1
  } else {
    s.calling = false; s.callReason = null; s.callTicks = 0
  }
  // only counts as neglect if a real need is ignored for a very long time
  if (s.calling && s.callReason !== 'misbehave' && s.callTicks >= 30) {
    s.careMistakes++
    s.callTicks = 0
  } else if (s.calling && s.callReason === 'misbehave' && s.callTicks >= 12) {
    s.calling = false; s.callReason = null; s.callTicks = 0
  }

  // evolution
  if (s.stage === 'baby' && s.stageAge >= STAGE_LEN.baby) {
    s.stage = 'child'; s.stageAge = 0; s.weight = baseWeight('child'); s.react = 'grew up!'
  } else if (s.stage === 'child' && s.stageAge >= STAGE_LEN.child) {
    s.stage = 'teen'; s.stageAge = 0; s.weight = baseWeight('teen'); s.react = 'grew up!'
  } else if (s.stage === 'teen' && s.stageAge >= STAGE_LEN.teen) {
    s.stage = 'adult'; s.stageAge = 0; s.weight = baseWeight('adult')
    s.form = s.careMistakes <= 8 ? 'good' : 'bad'
    s.react = 'evolved!'
  }

  // no death from neglect or illness — only a peaceful, very-long old age
  if (s.stage === 'adult' && s.stageAge >= ADULT_LIFE) {
    s.dead = true; s.calling = false; s.react = null
  }
  return s
}

function spriteFor(p) {
  switch (p.stage) {
    case 'egg': return EGG
    case 'baby': return BABY
    case 'child': return CHILD
    case 'teen': return TEEN
    default: return p.form === 'bad' ? ADULT_BAD : ADULT_GOOD
  }
}
const stageLabel = (p) =>
  p.dead ? 'R.I.P.'
    : p.stage === 'egg' ? 'Egg'
    : p.stage === 'adult' ? (p.form === 'bad' ? 'Adult' : 'Adult ★')
    : p.stage[0].toUpperCase() + p.stage.slice(1)
const statusLine = (p) =>
  p.dead ? 'passed away'
    : p.asleep ? 'asleep'
    : p.sick ? 'sick!'
    : p.calling
      ? (p.callReason === 'misbehave' ? 'wants attention' : p.callReason + '!')
      : 'happy'

// eye pixels ('k') per sprite, split into left/right clusters — used to
// close the eyes when asleep/blinking.
const EYE_CACHE = new Map()
function getEyes(sprite) {
  if (EYE_CACHE.has(sprite)) return EYE_CACHE.get(sprite)
  const pts = []
  sprite.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === 'k') pts.push({ x, y }) })
  const box = (arr) => arr.length ? {
    x0: Math.min(...arr.map((p) => p.x)), x1: Math.max(...arr.map((p) => p.x)),
    y: (Math.min(...arr.map((p) => p.y)) + Math.max(...arr.map((p) => p.y))) / 2,
  } : null
  const res = pts.length ? { left: box(pts.filter((p) => p.x < 8)), right: box(pts.filter((p) => p.x >= 8)) } : null
  EYE_CACHE.set(sprite, res)
  return res
}
function drawHeart(ctx, x, y, r, color, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x - r * 0.5, y - r * 0.2, r * 0.55, 0, Math.PI * 2)
  ctx.arc(x + r * 0.5, y - r * 0.2, r * 0.55, 0, Math.PI * 2)
  ctx.moveTo(x - r, y - r * 0.1); ctx.lineTo(x, y + r * 1.1); ctx.lineTo(x + r, y - r * 0.1); ctx.closePath()
  ctx.fill(); ctx.restore()
}
function drawSpark(ctx, x, y, r, color, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color
  ctx.fillRect(x - r * 0.16, y - r, r * 0.32, r * 2)
  ctx.fillRect(x - r, y - r * 0.16, r * 2, r * 0.32)
  ctx.restore()
}

// ── module-scope components (stable identity → clicks survive re-renders) ──
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
      <b>{ic}</b>{label}
    </button>
  )
}

export default function PixelPet() {
  const [pet, setPet] = useState(loadPet)
  const [view, setView] = useState('pet') // pet | feed | games | game | stats
  const [menuSel, setMenuSel] = useState(0)
  const [, bump] = useState(0)
  const rerender = () => bump((n) => n + 1)

  const petRef = useRef(pet); petRef.current = pet
  const viewRef = useRef(view); viewRef.current = view
  const game = useRef(null)
  const canvas = useRef(null)
  const celebrateRef = useRef(null) // rare reward animation
  const hopRef = useRef(null)       // little happy hop on interaction

  const hop = () => { hopRef.current = { startT: null } }
  const celebrate = () => { celebrateRef.current = { startT: null }; playSound('celebrate') }
  // ~14% chance for a rare celebration when you do something good
  const maybeCelebrate = () => { if (Math.random() < 0.14) celebrate() }

  useEffect(() => {
    const id = setInterval(() => setPet((p) => stepPet(p)), TICK)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ ...pet, lastSeen: Date.now() })) } catch {}
  }, [pet])
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
      if (viewRef.current === 'game' && game.current) { updateGame(dt); drawGame(ctx, cell, t) }
      else drawCreature(ctx, cell, t)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const drawSprite = (ctx, sprite, cell, ox, oy, closeEyes) => {
    sprite.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        let ch = row[x]
        if (ch === 'k' && closeEyes) ch = 'Y' // erase eyes so we can draw closed ones
        const c = PAL[ch]
        if (!c) continue
        ctx.fillStyle = c
        ctx.fillRect((ox + x) * cell, (oy + y) * cell, cell + 0.5, cell + 0.5)
      }
    })
  }
  const drawCreature = (ctx, cell, t) => {
    const p = petRef.current
    const S = GRID * cell
    if (p.dead) {
      ctx.fillStyle = '#8a8f86'
      ctx.fillRect(5 * cell, 5 * cell, 6 * cell, 8 * cell)
      ctx.beginPath(); ctx.arc(8 * cell, 5 * cell, 3 * cell, Math.PI, 0); ctx.fill()
      ctx.fillStyle = '#4a4a44'
      ctx.fillRect(7.4 * cell, 7 * cell, 1.2 * cell, 4 * cell)
      ctx.fillRect(6 * cell, 8.2 * cell, 4 * cell, 1.2 * cell)
      return
    }

    // celebration + hop timing
    let cel = celebrateRef.current
    if (cel) { if (cel.startT === null) cel.startT = t; if (t - cel.startT >= 1700) { celebrateRef.current = null; cel = null } }
    let hopOff = 0
    const hp = hopRef.current
    if (hp) { if (hp.startT === null) hp.startT = t; const k = (t - hp.startT) / 430; if (k >= 1) hopRef.current = null; else hopOff = Math.sin(k * Math.PI) * 3 }

    const sprite = spriteFor(p)
    let bounce = 0
    if (cel) bounce = Math.abs(Math.sin((t - cel.startT) / 100)) * 2.6
    else if (p.stage !== 'egg') bounce = (Math.floor(t / 450) % 2) ? 1 : 0
    const oy = -(bounce + hopOff)

    const blink = !p.asleep && !cel && (t % 3400) < 130
    const closeEyes = p.asleep || blink
    const sad = !p.asleep && !cel && (p.happy < 22 || p.sick)

    drawSprite(ctx, sprite, cell, 0, oy, closeEyes)

    // closed eyes → dashes
    if (closeEyes) {
      const eyes = getEyes(sprite)
      if (eyes) {
        ctx.fillStyle = '#2a2320'
        for (const e of [eyes.left, eyes.right]) {
          if (!e) continue
          ctx.fillRect(e.x0 * cell, (e.y + oy + 0.35) * cell, (e.x1 - e.x0 + 1) * cell, cell * 0.5)
        }
      }
    } else if (sad) {
      // a little blue tear under one eye
      const eyes = getEyes(sprite)
      if (eyes && eyes.left) {
        ctx.fillStyle = '#5aa0e0'
        ctx.fillRect(eyes.left.x0 * cell, (eyes.left.y + oy + 1.1) * cell, cell * 0.7, cell * 1.2)
      }
    }

    // poop
    for (let i = 0; i < p.poopCount; i++) {
      ctx.fillStyle = '#7a4a1e'
      ctx.fillRect((1 + i * 1.6) * cell, 14 * cell, cell * 1.3, cell)
    }

    if (p.asleep) {
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(0, 0, S, S)
      ctx.fillStyle = '#4a5a78'; ctx.font = `${Math.round(cell * 2)}px monospace`
      ctx.fillText('z', 12 * cell, 4 * cell); ctx.fillText('z', 13.4 * cell, 2.6 * cell)
    } else {
      if (p.sick) { ctx.fillStyle = '#3f9d55'; ctx.fillRect(11.5 * cell, 2 * cell, cell, cell * 1.4) }
      if (p.calling && Math.floor(t / 380) % 2) {
        ctx.fillStyle = '#e0342e'
        ctx.fillRect(13 * cell, 1.5 * cell, cell * 0.9, cell * 2)
        ctx.fillRect(13 * cell, 4 * cell, cell * 0.9, cell * 0.9)
      }
    }

    // rare celebration burst
    if (cel) {
      const prog = (t - cel.startT) / 1700
      if (prog < 0.18) { ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - prog / 0.18)})`; ctx.fillRect(0, 0, S, S) }
      for (let i = 0; i < 7; i++) {
        const a = i * (Math.PI * 2 / 7) - Math.PI / 2
        const dist = prog * cell * 6.5
        const px = S / 2 + Math.cos(a) * dist
        const py = S / 2 + Math.sin(a) * dist - prog * cell * 3.5
        const al = Math.max(0, 1 - prog)
        if (i % 2) drawHeart(ctx, px, py, cell * 0.9, '#ff5b6e', al)
        else drawSpark(ctx, px, py, cell * 0.9, '#ffd23f', al)
      }
    }
  }
  const text = (ctx, s, x, y, size, col = '#3a3140', align = 'center') => {
    ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = 'middle'
    ctx.font = `bold ${size}px monospace`; ctx.fillText(s, x, y); ctx.textAlign = 'left'
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
      for (let i = 0; i < 3; i++) { ctx.fillStyle = i < g.score ? '#1f9d4d' : '#b9c2a8'; ctx.fillRect((5.5 + i * 1.8) * cell, 3 * cell, cell, cell) }
      if (g.reveal) {
        text(ctx, g.reveal.actual === 0 ? '◀' : '▶', S / 2, S * 0.55, cell * 4, g.reveal.correct ? '#1f9d4d' : '#b03a3a')
        text(ctx, g.reveal.correct ? '✓' : '✗', S / 2, S * 0.82, cell * 1.6, g.reveal.correct ? '#1f9d4d' : '#b03a3a')
      } else { text(ctx, 'which way?', S / 2, S * 0.5, cell * 1.1); text(ctx, '◀   ▶', S / 2, S * 0.68, cell * 2) }
    } else if (g.id === 'catch') {
      text(ctx, 'CAUGHT ' + g.caught + '/' + g.max, S / 2, cell * 1.4, cell)
      ctx.fillStyle = '#e0407a'; g.items.forEach((it) => ctx.fillRect(it.x * cell, it.y * cell, cell * 1.4, cell * 1.4))
      ctx.fillStyle = '#5a3a1e'; ctx.fillRect((g.basketX - 1.4) * cell, 13.4 * cell, cell * 2.8, cell * 1.4)
    } else {
      text(ctx, 'HITS ' + g.hits + '/3', S / 2, cell * 1.4, cell)
      ctx.fillStyle = '#b9c2a8'; ctx.fillRect(cell, S * 0.55, S - 2 * cell, cell * 1.6)
      ctx.fillStyle = '#8fd6a0'; ctx.fillRect(6.5 * cell, S * 0.55, 3 * cell, cell * 1.6)
      ctx.fillStyle = '#2a2320'; ctx.fillRect(g.pos * cell, S * 0.5, cell * 0.7, cell * 2.4)
      text(ctx, 'tap in the green!', S / 2, S * 0.8, cell)
    }
  }
  const updateGame = (dt) => {
    const g = game.current
    if (!g || g.over) return
    if (g.id === 'catch') {
      g.basketX = clampN(g.basketX + g.dir * 11 * dt, 1.4, 14.6)
      g.spawn += dt
      if (g.total < g.max && g.spawn > 0.75) { g.spawn = 0; g.items.push({ x: 1 + Math.random() * 12.5, y: -1.5 }); g.total++ }
      g.items.forEach((it) => (it.y += 5.2 * dt))
      g.items = g.items.filter((it) => { if (it.y >= 13) { if (Math.abs(it.x - g.basketX) <= 1.5) g.caught++; return false } return true })
      if (g.total >= g.max && g.items.length === 0) endCatch()
    } else if (g.id === 'tap') {
      g.pos += g.dir * 11 * dt
      if (g.pos > 14) { g.pos = 14; g.dir = -1 }
      if (g.pos < 1) { g.pos = 1; g.dir = 1 }
    }
  }

  // ── care actions (side-effects kept outside the state updater) ──
  const clearCall = (s) => { s.calling = false; s.callReason = null; s.callTicks = 0; return s }
  const meal = () => {
    const p = petRef.current
    hop(); playSound('happy'); if (p.hunger < 40) maybeCelebrate()
    setPet((q) => clearCall({ ...q, react: '🍚 yum', hunger: clamp(q.hunger + 30), weight: q.weight + 2 }))
    setView('pet')
  }
  const snack = () => {
    hop(); playSound('happy')
    setPet((q) => ({ ...q, react: '🍬 tasty', happy: clamp(q.happy + 16), weight: q.weight + 3 }))
    setView('pet')
  }
  const cleanUp = () => {
    const p = petRef.current
    hop(); playSound('happy'); if (p.poopCount > 0) maybeCelebrate()
    setPet((q) => clearCall({ ...q, react: '✨ clean', poopCount: 0, clean: 100 }))
  }
  const sleep = () => { hop(); playSound('select'); setPet((q) => clearCall({ ...q, react: q.asleep ? '☀' : '💤', asleep: !q.asleep })) }
  const heal = () => { hop(); playSound('happy'); maybeCelebrate(); setPet((q) => clearCall({ ...q, react: '💊 better', sick: false, sickTicks: 0, happy: clamp(q.happy + 10) })) }
  const scold = () => {
    const p = petRef.current
    if (!p.calling) return
    if (p.callReason === 'misbehave') { playSound('click'); setPet((q) => clearCall({ ...q, react: '💢 scolded', discipline: clamp(q.discipline + 15) })) }
    else setPet((q) => ({ ...q, react: '😢 it needed you', careMistakes: q.careMistakes + 1 }))
  }
  const rebirth = () => { playSound('happy'); setPet(freshEgg((petRef.current.generation || 1) + 1)); setView('pet') }

  // ── games ──
  const openGames = () => {
    const p = petRef.current
    if (p.stage === 'egg' || p.dead) return
    if (p.energy < 15) { setPet((q) => ({ ...q, react: '😩 tired' })); return }
    setMenuSel(0); setView('games')
  }
  const startGame = (id) => {
    if (id === 'guess') game.current = { id, round: 1, score: 0, reveal: null, over: null }
    if (id === 'catch') game.current = { id, basketX: 7.5, dir: 0, items: [], caught: 0, total: 0, max: 12, spawn: 0, over: null }
    if (id === 'tap') game.current = { id, pos: 1, dir: 1, tries: 0, hits: 0, over: null }
    setView('game'); rerender()
  }
  const finish = (win, reward, cost, msg) => {
    game.current.over = { win, reward, msg }
    if (win) { playSound('happy'); maybeCelebrate() }
    setPet((p) => ({ ...p, happy: clamp(p.happy + reward), energy: clamp(p.energy - cost), weight: Math.max(baseWeight(p.stage), p.weight - 1) }))
    rerender()
  }
  const endCatch = () => { const g = game.current; finish(g.caught >= g.max / 2, Math.round((g.caught / g.max) * 30), 10, g.caught + ' caught') }
  const guess = (dir) => {
    const g = game.current
    if (g.reveal || g.over) return
    const actual = Math.random() < 0.5 ? 0 : 1
    const correct = dir === actual
    if (correct) g.score++
    g.reveal = { guess: dir, actual, correct }; rerender()
    setTimeout(() => {
      g.reveal = null
      if (g.round >= 3) finish(g.score >= 2, g.score >= 2 ? 26 : 8, 8, g.score + '/3 right')
      else { g.round++; rerender() }
    }, 950)
  }
  const tap = () => {
    const g = game.current
    if (g.over) return
    g.tries++
    if (g.pos >= 6.5 && g.pos <= 9.5) g.hits++
    if (g.tries >= 3) finish(g.hits >= 2, g.hits * 9, 6, g.hits + '/3 hits')
    else rerender()
  }
  const backToPet = () => { game.current = null; setView('pet') }
  const onScreenTap = () => {
    if (viewRef.current !== 'pet') return
    const p = petRef.current
    if (p.dead || p.asleep) return
    if (p.calling) { scold(); return }
    hop(); playSound('happy'); maybeCelebrate() // pet it → happy (and sometimes a rare treat)
    setPet((q) => ({ ...q, react: '❤', happy: clamp(q.happy + 5) }))
  }

  // ── button sets per view ──
  let buttons
  if (view === 'feed') {
    buttons = [
      { ic: '🍚', label: 'Meal', onClick: meal },
      { ic: '🍬', label: 'Snack', onClick: snack },
      { ic: '✕', label: 'Back', onClick: () => setView('pet') },
    ]
  } else if (view === 'games') {
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
  } else if (view === 'stats') {
    buttons = [{ ic: '✓', label: 'Back', onClick: () => setView('pet') }]
  } else if (pet.dead) {
    buttons = [{ ic: '🥚', label: 'New Egg', onClick: rebirth }]
  } else {
    buttons = [
      { ic: '🍎', label: 'Feed', onClick: () => setView('feed') },
      { ic: '🎮', label: 'Play', onClick: openGames },
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

      <div className="pet-screen" onClick={onScreenTap}>
        <canvas ref={canvas} className="pet-canvas" />
        {pet.react && view === 'pet' && <div className="pet-react">{pet.react}</div>}

        {view === 'feed' && (
          <div className="pet-menu-ov">
            <div className="pet-menu-title">▶ FEED</div>
            <div className="pet-menu-row">🍚 Meal <span className="pet-dim">fills tummy</span></div>
            <div className="pet-menu-row">🍬 Snack <span className="pet-dim">+ fun, + weight</span></div>
          </div>
        )}
        {view === 'games' && (
          <div className="pet-menu-ov">
            <div className="pet-menu-title">▶ MINI-GAMES</div>
            {GAMES.map((gm, i) => (
              <div key={gm.id} className={`pet-menu-row ${i === menuSel ? 'sel' : ''}`}>{gm.name}</div>
            ))}
            <div className="pet-menu-hint">◀▶ pick · 🅰 play</div>
          </div>
        )}
        {view === 'stats' && (
          <div className="pet-menu-ov pet-stats">
            <div className="pet-menu-title">▶ {pet.name} · Gen {pet.generation}</div>
            <div className="pet-stat"><span>Stage</span><b>{stageLabel(pet)}</b></div>
            <div className="pet-stat"><span>Age</span><b>{Math.floor(pet.ticks / TICKS_PER_DAY)}d</b></div>
            <div className="pet-stat"><span>Weight</span><b>{Math.round(pet.weight)}g</b></div>
            <div className="pet-stat"><span>Hunger</span><b>{heartStr(pet.hunger)}</b></div>
            <div className="pet-stat"><span>Happy</span><b>{heartStr(pet.happy)}</b></div>
            <div className="pet-stat"><span>Discipline</span><b>{Math.round(pet.discipline)}%</b></div>
          </div>
        )}
      </div>

      <div
        className="pet-name"
        onClick={() => !pet.dead && view === 'pet' && setView('stats')}
        title="tap for stats"
      >
        {view === 'game' ? 'Playing…' : <>{pet.name} · <span className="pet-stage">{statusLine(pet)}</span></>}
      </div>

      <div className="pet-buttons">
        {buttons.map((b, i) => <Btn key={i} {...b} />)}
      </div>
    </div>
  )
}
