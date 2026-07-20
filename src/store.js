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
export const useOS = create((set, get) => ({
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
    const cfg = app.window || {}
    const win = {
      id: idCounter++,
      appId,
      title: app.name,
      x: cfg.x ?? 120,
      y: cfg.y ?? 100,
      w: cfg.w ?? 480,
      h: cfg.h ?? 360,
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
}))
