// ═══════════════════════════════════════════════════════════════════
//  The real Kedge engine — Rust → WebAssembly — shared across the site.
//  Same kedge_core::classify the engine uses. The glue + .wasm live in
//  /public (served as-is at /kedge/pkg/), loaded through an injected module
//  <script> rather than a source-level import(): Vite's dev server refuses
//  to run /public JS through its module pipeline, but a runtime <script> is
//  plain page context, so the browser fetches the static file directly —
//  identical behaviour in dev and in the production build. Cached after
//  first load, so every caller shares one instance.
// ═══════════════════════════════════════════════════════════════════
let wasmPromise = null

export function loadEngine() {
  if (!wasmPromise) {
    wasmPromise = new Promise((resolve, reject) => {
      const url = ['', 'kedge', 'pkg', 'kedge_web.js'].join('/')
      const done = (fn) => {
        window.removeEventListener('kedge:ready', ready)
        window.removeEventListener('kedge:error', fail)
        fn()
      }
      const ready = () => done(() => resolve({ classify_command: window.__kedgeClassify }))
      const fail = (e) => done(() => reject(new Error(e?.detail || 'engine load failed')))
      window.addEventListener('kedge:ready', ready, { once: true })
      window.addEventListener('kedge:error', fail, { once: true })
      const s = document.createElement('script')
      s.type = 'module'
      s.textContent =
        `import init, { classify_command } from ${JSON.stringify(url)};\n` +
        `init().then(() => { window.__kedgeClassify = classify_command;` +
        ` window.dispatchEvent(new Event('kedge:ready')); })\n` +
        `.catch((e) => window.dispatchEvent(new CustomEvent('kedge:error', { detail: String(e) })));`
      s.onerror = () => fail({ detail: 'script load failed' })
      document.head.appendChild(s)
    })
  }
  return wasmPromise
}

/** Classify a shell command with the real engine. Returns the parsed verdict. */
export async function classify(command) {
  const mod = await loadEngine()
  return JSON.parse(mod.classify_command(command))
}
