// Shared type definitions for the OS shell.
// These give the manifest and the window-manager store compile-time safety
// (`npm run typecheck`) without migrating the whole app to TypeScript.
import type { ComponentType } from 'react'

/** How an app's window content is rendered. */
export type AppType = 'component' | 'iframe' | 'url' | 'html' | 'link'

/** Default window geometry for an app. */
export interface AppWindow {
  w?: number
  h?: number
  x?: number
  y?: number
}

/**
 * One entry in the app manifest (`src/apps.js`). Adding an app is a single
 * object here — the window manager never needs to know about it specifically.
 */
export interface AppManifest {
  /** Stable unique id (also the key used by `openApp`). */
  id: string
  /** Display name in the title bar, menu, and desktop label. */
  name: string
  /** Which renderer to use for this app's window. */
  type: AppType
  /** An emoji, or a React component that draws the icon. */
  icon: string | ComponentType<any>
  /** Apple-menu grouping (folded category). Optional. */
  category?: string
  /** The React component to mount, when `type === 'component'`. */
  component?: ComponentType<any>
  /** Content URL/path, for `iframe` | `url` | `link` (or inline HTML for `html`). */
  src?: string
  /** Default window size/position. */
  window?: AppWindow
  /** Render as a frameless floating widget (BitBoy, Tamachu). */
  chromeless?: boolean
  /** Show an icon on the desktop. */
  onDesktop?: boolean
  /** Show in the Apple/File menus. */
  menu?: boolean
}

/** A live, open window tracked by the Zustand store. */
export interface WinInstance {
  id: number
  appId: string
  title: string
  x: number
  y: number
  w: number
  h: number
  z: number
  minimized: boolean
  collapsed?: boolean
  zoomPrev?: { x: number; y: number; w: number; h: number } | null
}

/** A system alert dialog (About box, Empty Trash, …). */
export interface OSDialog {
  icon?: string
  title: string
  body: string
}

export type PowerState = 'on' | 'sleep' | 'off'
export type IconSort = 'default' | 'name' | 'kind'

/** The window-manager + system state held in the Zustand store (`src/store.js`). */
export interface OSState {
  windows: WinInstance[]
  theme: string
  setTheme: (key: string) => void
  power: PowerState
  setPower: (power: PowerState) => void
  dialog: OSDialog | null
  showDialog: (dialog: OSDialog) => void
  closeDialog: () => void
  iconSort: IconSort
  setIconSort: (iconSort: IconSort) => void
  openApp: (appId: string) => void
  close: (id: number) => void
  closeAll: () => void
  closeFront: () => void
  focus: (id: number) => void
  move: (id: number, x: number, y: number) => void
  resize: (id: number, w: number, h: number) => void
  toggleCollapse: (id: number) => void
  toggleZoom: (id: number) => void
}
