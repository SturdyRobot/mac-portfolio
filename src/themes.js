// ═══════════════════════════════════════════════════════════════════
//  THEMES — the iMac G3 "flavors".
//  Each one re-colors the accents (title-bar tint, scrollbars, links,
//  selection) and the desktop gradient. Applied live via CSS variables.
//
//  Add your own flavor by dropping another entry here.
// ═══════════════════════════════════════════════════════════════════

export const themes = [
  {
    key: 'bondi', name: 'Bondi Blue',
    accent: '#1a9bb0', accentLt: '#d6eef2', accentPl: '#eaf7f9', highlight: '#2c6fb3',
    desk: ['#7fd3dc', '#3fa9b8', '#237e8c'],
  },
  {
    key: 'blueberry', name: 'Blueberry',
    accent: '#2f6fd0', accentLt: '#dbe6fb', accentPl: '#eef3fd', highlight: '#2c5fb3',
    desk: ['#86b5ef', '#4f7fd6', '#2f57a8'],
  },
  {
    key: 'grape', name: 'Grape',
    accent: '#7a4fc0', accentLt: '#e7dcf7', accentPl: '#f2ecfb', highlight: '#6a3fb0',
    desk: ['#b79ae6', '#8a5fd0', '#5e3aa0'],
  },
  {
    key: 'tangerine', name: 'Tangerine',
    accent: '#e8791f', accentLt: '#fbe4cf', accentPl: '#fdf1e6', highlight: '#d2661a',
    desk: ['#f6b57f', '#ee8a3f', '#c9631f'],
  },
  {
    key: 'lime', name: 'Lime',
    accent: '#5aa81f', accentLt: '#e2f3cf', accentPl: '#f1f9e6', highlight: '#4e9a1a',
    desk: ['#b6e07f', '#7fc23f', '#5a9a1f'],
  },
  {
    key: 'strawberry', name: 'Strawberry',
    accent: '#d63a5e', accentLt: '#fbd6de', accentPl: '#fdeaef', highlight: '#c02c4e',
    desk: ['#f08fa6', '#e05f7f', '#b03a5a'],
  },
  {
    key: 'graphite', name: 'Graphite',
    accent: '#8a8f96', accentLt: '#e4e5e7', accentPl: '#f2f2f3', highlight: '#6b7078',
    desk: ['#b8c0c8', '#8b939c', '#5f666e'],
  },
]

export const DEFAULT_THEME = 'bondi'

export function getTheme(key) {
  return themes.find((t) => t.key === key) || themes[0]
}

// Push a theme's colors onto the root element as CSS variables.
export function applyTheme(key) {
  if (typeof document === 'undefined') return
  const t = getTheme(key)
  const r = document.documentElement.style
  r.setProperty('--bondi', t.accent)
  r.setProperty('--bondi-lt', t.accentLt)
  r.setProperty('--bondi-pl', t.accentPl)
  r.setProperty('--highlight', t.highlight)
  r.setProperty('--desk-a', t.desk[0])
  r.setProperty('--desk-b', t.desk[1])
  r.setProperty('--desk-c', t.desk[2])
}
