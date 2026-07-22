// ═══════════════════════════════════════════════════════════════════
//  Tiny retro sound engine — synthesized 8-bit blips via Web Audio,
//  no audio files. Mute state persists to localStorage.
// ═══════════════════════════════════════════════════════════════════

let ctx = null
let muted = false
try {
  muted = localStorage.getItem('mac-muted') === '1'
} catch {}

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// one short note with an attack/release envelope
function tone(freq, start, dur, { type = 'square', vol = 0.05, slideTo } = {}) {
  const c = ac()
  if (!c) return
  const t0 = c.currentTime + start
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(vol, t0 + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

export function playSound(name) {
  if (muted) return
  try {
    switch (name) {
      case 'click':
        tone(660, 0, 0.05, { vol: 0.04 })
        break
      case 'open':
        tone(523, 0, 0.06, { vol: 0.05 })
        tone(784, 0.06, 0.08, { vol: 0.05 })
        break
      case 'close':
        tone(560, 0, 0.07, { vol: 0.045, slideTo: 300 })
        break
      case 'alert':
        tone(880, 0, 0.09, { type: 'sine', vol: 0.06 })
        tone(587, 0.11, 0.16, { type: 'sine', vol: 0.06 })
        break
      case 'select':
        tone(440, 0, 0.04, { vol: 0.03 })
        break
      case 'happy':
        tone(660, 0, 0.06, { type: 'triangle', vol: 0.05 })
        tone(880, 0.06, 0.09, { type: 'triangle', vol: 0.05 })
        break
      case 'celebrate': // rare reward fanfare — a little rising arpeggio
        tone(523, 0, 0.1, { type: 'square', vol: 0.05 })
        tone(659, 0.1, 0.1, { type: 'square', vol: 0.05 })
        tone(784, 0.2, 0.1, { type: 'square', vol: 0.05 })
        tone(1047, 0.3, 0.22, { type: 'square', vol: 0.06 })
        tone(1568, 0.42, 0.26, { type: 'triangle', vol: 0.05 })
        break
      default:
        break
    }
  } catch {}
}

export const isMuted = () => muted
export function setMuted(v) {
  muted = v
  try {
    localStorage.setItem('mac-muted', v ? '1' : '0')
  } catch {}
}
export function toggleMute() {
  setMuted(!muted)
  return muted
}
