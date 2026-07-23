// The AI-summary edge proxy (a Cloudflare Worker — see /worker).
// Blank by default, so the tool runs 100% offline with the deterministic
// summary. Set VITE_SCOPE_PROXY at build time to enable AI-polished prose.
export const SCOPE_PROXY =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SCOPE_PROXY) || ''
