// @ts-check
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
//  type: 'link'      → an external link; opens in a new browser tab (for sites
//                      that refuse to be framed, like GitHub).
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
import HighScores from './apps/HighScores.jsx'
import StartHere from './apps/StartHere.jsx'
import Terminal from './apps/Terminal.jsx'

/** @type {import('./types').AppManifest[]} */
export const apps = [
  {
    id: 'starthere',
    name: 'Start Here',
    category: 'Apps',
    icon: '👋',
    type: 'component',
    component: StartHere,
    window: { w: 440, h: 500, x: 60, y: 46 },
    onDesktop: true, // first thing a visitor sees
    menu: true,
  },
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
    id: 'hub',
    name: 'Projects',
    category: 'GitHub',
    icon: '🐙',
    type: 'iframe', // a fake GitHub profile showcasing the real work
    src: '/sites/hub/index.html',
    window: { w: 1000, h: 700, x: 70, y: 40 },
    onDesktop: true, // the project hub — worth surfacing
    menu: true,
  },
  {
    id: 'sturdyharness',
    name: 'SturdyHarness',
    category: 'GitHub',
    icon: '🦀',
    type: 'link', // opens the repo in a new tab (GitHub can't be framed)
    src: 'https://github.com/SturdyRobot/sturdy-harness',
    onDesktop: true, // a real Rust tool — worth featuring, not burying in a menu
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
    window: { w: 318, h: 600, x: 300, y: 30 },
    chromeless: true, // floating handheld, no window frame
    onDesktop: true, // a highlight — feature it
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
    id: 'terminal',
    name: 'Terminal',
    category: 'Apps',
    icon: '🖥️',
    type: 'component',
    component: Terminal,
    window: { w: 560, h: 380, x: 170, y: 80 },
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
    id: 'playground',
    name: 'RC Playground',
    category: 'Games',
    icon: '🚗',
    type: 'iframe',
    src: '/games/playground/index.html',
    window: { w: 640, h: 480, x: 150, y: 50 },
    onDesktop: true, // 3D physics demo — the one game worth featuring
    menu: true,
  },
  {
    id: 'zenomon',
    name: 'Zenomon',
    category: 'Games',
    icon: '🧬',
    type: 'iframe',
    src: '/games/zenomon/index.html',
    window: { w: 760, h: 680, x: 120, y: 40 },
    onDesktop: false, // menu-only (Apple menu → Games)
    menu: true,
  },
  {
    id: 'raid',
    name: 'Raid Clicker',
    category: 'Games',
    icon: '⚔️',
    type: 'iframe',
    src: '/games/raid/index.html',
    window: { w: 900, h: 640, x: 110, y: 44 },
    onDesktop: false, // menu-only (Apple menu → Games)
    menu: true,
  },
  {
    id: 'highscores',
    name: 'High Scores',
    category: 'Games',
    icon: '🏆',
    type: 'component',
    component: HighScores,
    window: { w: 300, h: 400, x: 420, y: 80 },
    onDesktop: true,
    menu: true,
  },
]

/** @param {string} id */
export const getApp = (id) => apps.find((a) => a.id === id)
