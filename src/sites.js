// ═══════════════════════════════════════════════════════════════════
//  THE SITE REGISTRY  —  your browser's secret sauce.
//
//  Maps a real domain → YOUR redesign of it. When someone types the
//  domain into the in-OS browser, they get your version instead of
//  the real site.
//
//  To add a redesign:
//   1. Build a self-contained page at /public/sites/<name>/index.html
//      (any style you want — it doesn't have to be retro).
//   2. Add an entry below. Add extra keys as aliases if you like.
//
//  Example:
//   'cocacola.com': {
//     name: 'Coca-Cola',
//     tagline: 'Bold rebrand concept',
//     path: '/sites/cocacola/index.html',
//   },
//   'coca-cola.com': { alias: 'cocacola.com' },
// ═══════════════════════════════════════════════════════════════════

export const sites = {
  // (empty — add your redesigns here)
}

// Turn any typed input into a lookup key: strip protocol, www, path.
export function domainKey(input) {
  let u = String(input || '').trim().toLowerCase()
  u = u.replace(/^[a-z]+:\/\//, '') // protocol
  u = u.replace(/^www\./, '') // www.
  u = u.replace(/\/.*$/, '') // path/query
  return u
}

// Resolve a key (following one level of alias) to a real entry.
export function resolveSite(key) {
  const hit = sites[key]
  if (!hit) return null
  if (hit.alias) return sites[hit.alias] || null
  return hit
}

// The list shown on the browser's home/directory page (no aliases).
export function siteDirectory() {
  return Object.entries(sites)
    .filter(([, v]) => !v.alias)
    .map(([domain, v]) => ({ domain, ...v }))
}
