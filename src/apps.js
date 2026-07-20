// ═══════════════════════════════════════════════════════════════════
//  THE APP MANIFEST
//  This is the ONLY file you edit to add new work to your desktop.
//  Add a game, a website, or an "about" page by dropping one entry here.
//
//  type: 'iframe'    → a self-contained thing you built (game/web app).
//                      Put the files in /public/... and point `src` at it.
//  type: 'url'       → a live website you made, loaded in a window.
//  type: 'component' → a built-in OS app (see src/apps/*.jsx).
//  type: 'html'      → a chunk of inline HTML/JSX (quick text pages).
//
//  onDesktop: true   → shows an icon on the desktop.
//  menu: true        → shows in the  Apple menu + File menu launchers.
//  (an app can be in the menus without cluttering the desktop.)
// ═══════════════════════════════════════════════════════════════════

import About from './apps/About.jsx'
import Browser from './apps/Browser.jsx'
import Appearance from './apps/Appearance.jsx'
import BitBoy from './apps/BitBoy.jsx'
import BitBoyIcon from './components/BitBoyIcon.jsx'
import WorldFrameIcon from './components/WorldFrameIcon.jsx'
import PixelPet from './apps/PixelPet.jsx'
import PixelPetIcon from './components/PixelPetIcon.jsx'

export const apps = [
  {
    id: 'worldframe',
    name: 'WorldFrame',
    category: 'Projects',
    icon: WorldFrameIcon,
    type: 'url',
    src: 'https://tryworldframe.com', // passes through to the real site
    window: { w: 900, h: 620, x: 90, y: 40 },
    onDesktop: true, // the flagship — featured on the desktop
    menu: true,
  },
  {
    id: 'tamachu',
    name: 'Tamachu',
    category: 'Toys',
    icon: PixelPetIcon,
    type: 'component',
    component: PixelPet,
    window: { w: 336, h: 396, x: 340, y: 64 },
    chromeless: true, // egg-shaped floating widget, no window frame
    onDesktop: false, // lives in the Apple menu → Toys
    menu: true,
  },
  {
    id: 'bitboy',
    name: 'BitBoy',
    category: 'Games',
    icon: BitBoyIcon, // a component instead of an emoji
    type: 'component',
    component: BitBoy,
    window: { w: 318, h: 588, x: 300, y: 36 },
    bleed: true, // device fills the window edge-to-edge
    onDesktop: false,
    menu: true,
  },
  {
    id: 'appearance',
    name: 'Appearance',
    icon: '🎨',
    type: 'component',
    component: Appearance,
    window: { w: 360, h: 340, x: 240, y: 90 },
    onDesktop: false, // lives in the Apple menu → Control Panels
  },
  {
    id: 'about',
    name: 'About Me',
    category: 'Apps',
    icon: '👤',
    type: 'component',
    component: About,
    window: { w: 380, h: 390, x: 60, y: 70 },
    onDesktop: true,
    menu: true,
  },
  {
    id: 'browser',
    name: 'Web Browser',
    category: 'Apps',
    icon: '🌐',
    type: 'component',
    component: Browser,
    window: { w: 640, h: 460, x: 200, y: 90 },
    onDesktop: false,
    menu: true,
  },
  {
    id: 'breakout',
    name: 'Breakout',
    category: 'Games',
    icon: '🧱',
    type: 'iframe',
    src: '/games/breakout/index.html',
    window: { w: 480, h: 420, x: 320, y: 130 },
    onDesktop: false,
    menu: true,
  },
  {
    id: 'myblog',
    name: 'My Website',
    category: 'Sites',
    icon: '📝',
    type: 'url',
    // ↓ change this to a site YOU made
    src: 'https://example.com',
    window: { w: 720, h: 500, x: 150, y: 60 },
    onDesktop: false,
    menu: true,
  },
]

export const getApp = (id) => apps.find((a) => a.id === id)
