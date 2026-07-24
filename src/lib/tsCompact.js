// ═══════════════════════════════════════════════════════════════════
//  Live AST compaction — in the browser, for real.
//
//  The kedge-compact Rust crate can't target the browser (Tree-sitter's C
//  grammars need libc, absent on wasm32-unknown-unknown). So this runs the
//  OFFICIAL Tree-sitter, compiled to WebAssembly (web-tree-sitter), over the
//  code you type — and applies the SAME signature-preserving elision strategy
//  kedge uses (collect_body_elisions): keep every signature, elide the bodies.
//  Deterministic, no LLM, no server. Numbers below are measured, not asserted.
// ═══════════════════════════════════════════════════════════════════
let cache = null

/** Load + init Tree-sitter (WASM) with the Rust grammar. Cached. */
export async function loadRustParser() {
  if (cache) return cache
  const mod = await import('web-tree-sitter')
  // CJS→ESM interop can wrap the Parser class as default / default.default / namespace
  const Parser = [mod.default, mod.default && mod.default.default, mod].find(
    (x) => x && typeof x.init === 'function',
  )
  if (!Parser) throw new Error('web-tree-sitter: Parser.init not found (keys: ' + Object.keys(mod) + ')')
  await Parser.init({ locateFile: (name) => `/wasm/${name}` }) // resolves tree-sitter.wasm
  const grammarBytes = new Uint8Array(await (await fetch('/wasm/tree-sitter-rust.wasm')).arrayBuffer())
  const Rust = await Parser.Language.load(grammarBytes)
  const parser = new Parser()
  parser.setLanguage(Rust)
  const coreBytes = (await (await fetch('/wasm/tree-sitter.wasm')).arrayBuffer()).byteLength
  cache = { parser, wasmBytes: coreBytes + grammarBytes.byteLength }
  return cache
}

// Collect the body block of every function (incl. methods). We stop descending
// once we take a body, so a nested fn is elided with its enclosing body — same
// as kedge, which never elides inside an already-elided span.
function collectFnBodies(node, out) {
  if (node.type === 'function_item') {
    const body = node.childForFieldName('body')
    if (body && body.type === 'block') { out.push(body); return }
  }
  for (const child of node.children) collectFnBodies(child, out)
}

/**
 * Compact Rust source: signatures kept, bodies elided. Returns the compacted
 * text plus measured stats.
 * @param {object} parser  a web-tree-sitter Parser with the Rust grammar set
 * @param {string} code
 */
export function compact(parser, code) {
  const t0 = performance.now()
  const tree = parser.parse(code)
  const bodies = []
  collectFnBodies(tree.rootNode, bodies)
  bodies.sort((a, b) => a.startIndex - b.startIndex)

  let out = ''
  let cursor = 0
  let elided = 0
  for (const b of bodies) {
    if (b.startIndex < cursor) continue // inside an already-elided body
    const lines = b.endPosition.row - b.startPosition.row + 1
    out += code.slice(cursor, b.startIndex)
    out += `{ /* ${lines} line${lines === 1 ? '' : 's'} elided */ }`
    cursor = b.endIndex
    elided += 1
  }
  out += code.slice(cursor)
  tree.delete?.()

  const ms = performance.now() - t0
  // ~4 chars/token is the common GPT-family rule of thumb; labelled "est." in UI.
  const tok = (s) => Math.max(1, Math.round(s.length / 4))
  return {
    compacted: out,
    elided,
    ms,
    origChars: code.length,
    compChars: out.length,
    origTokens: tok(code),
    compTokens: tok(out),
  }
}
