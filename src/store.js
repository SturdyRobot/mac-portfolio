// @ts-check
import { create } from 'zustand'
import { getApp } from './apps.js'
import { applyTheme, DEFAULT_THEME } from './themes.js'
import { playSound } from './sound.js'

let zCounter = 10
let idCounter = 1

const savedTheme =
  (typeof localStorage !== 'undefined' && localStorage.getItem('mac-theme')) ||
  DEFAULT_THEME

// A tiny window manager. Each open window is one entry here.
export const useOS = create(
  /** @type {import('zustand').StateCreator<import('./types').OSState>} */
  ((set, get) => ({
  /** @type {import('./types').WinInstance[]} */
  windows: [],

  // ─── Appearance ───
  theme: savedTheme,
  setTheme: (key) => {
    try {
      localStorage.setItem('mac-theme', key)
    } catch {}
    applyTheme(key)
    set({ theme: key })
  },

  // ─── System UI state (driven by the menu bar) ───
  power: 'on', // on | sleep | off
  setPower: (power) => set({ power }),
  dialog: null, // { title, body } | null
  showDialog: (dialog) => {
    playSound('alert')
    set({ dialog })
  },
  closeDialog: () => set({ dialog: null }),
  iconSort: 'default', // default | name | kind
  setIconSort: (iconSort) => set({ iconSort }),

  openApp: (appId) => {
    const existing = get().windows.find((w) => w.appId === appId)
    if (existing) {
      get().focus(existing.id)
      set((s) => ({
        windows: s.windows.map((w) =>
          w.id === existing.id ? { ...w, minimized: false } : w,
        ),
      }))
      return
    }
    const app = getApp(appId)
    if (!app) return
    // A plain external link (e.g. a GitHub repo that refuses to be framed):
    // open it in a new browser tab instead of spawning a window.
    if (app.type === 'link') {
      if (typeof window !== 'undefined' && app.src) {
        window.open(app.src, '_blank', 'noopener,noreferrer')
      }
      return
    }
    const cfg = app.window || {}
    // Always open so the WHOLE app is visible with no fiddling: fit the window to
    // the viewport, then centre framed apps (floating widgets keep their spot).
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280
    const vh = typeof window !== 'undefined' ? window.innerHeight : 720
    const small = vw <= 640
    let w, h, x, y
    if (small && !app.chromeless) {
      // phones: framed apps open (nearly) full-screen so they're actually usable
      x = 4
      y = 28
      w = vw - 8
      h = vh - 34
    } else {
      w = Math.max(220, Math.min(cfg.w ?? 480, vw - 12))
      h = Math.max(150, Math.min(cfg.h ?? 360, vh - 34))
      if (app.chromeless) {
        // floating widgets (BitBoy, Tamachu) keep their intended placement
        x = Math.max(4, Math.min(cfg.x ?? 120, vw - w - 6))
        y = Math.max(24, Math.min(cfg.y ?? 100, vh - h - 6))
      } else {
        // centre it, nudged a little per already-open window so they don't stack dead-on
        const openCount = get().windows.filter((k) => !k.minimized).length
        const off = (openCount % 6) * 22
        x = Math.max(4, Math.min(Math.round((vw - w) / 2) - 44 + off, vw - w - 6))
        y = Math.max(24, Math.min(Math.round((vh - h) * 0.42) - 22 + off, vh - h - 6))
      }
    }
    const win = {
      id: idCounter++,
      appId,
      title: app.name,
      x, y, w, h,
      z: ++zCounter,
      minimized: false,
    }
    playSound('open')
    set((s) => ({ windows: [...s.windows, win] }))
  },

  close: (id) => {
    playSound('close')
    set((s) => ({ windows: s.windows.filter((w) => w.id !== id) }))
  },

  closeAll: () => set({ windows: [] }),

  // close the frontmost (highest-z) window
  closeFront: () => {
    const ws = get().windows
    if (!ws.length) return
    const top = ws.reduce((a, b) => (a.z > b.z ? a : b))
    get().close(top.id)
  },

  focus: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, z: ++zCounter } : w,
      ),
    })),

  move: (id, x, y) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
    })),

  resize: (id, w, h) =>
    set((s) => ({
      windows: s.windows.map((win) =>
        win.id === id ? { ...win, w, h } : win,
      ),
    })),

  // Window-shade: roll the window up to just its title bar.
  toggleCollapse: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, collapsed: !w.collapsed } : w,
      ),
    })),

  // Zoom: toggle between the user's size and a large "ideal" size.
  toggleZoom: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => {
        if (w.id !== id) return w
        if (w.zoomPrev) {
          const { zoomPrev, ...rest } = w
          return { ...rest, ...zoomPrev, zoomPrev: null }
        }
        return {
          ...w,
          zoomPrev: { x: w.x, y: w.y, w: w.w, h: w.h },
          x: 12,
          y: 30,
          w: Math.max(320, window.innerWidth - 120),
          h: Math.max(240, window.innerHeight - 60),
        }
      }),
    })),
})))
