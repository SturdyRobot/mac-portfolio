import { useEffect, useRef, useState } from 'react'
import { loadRustParser, compact } from '../lib/tsCompact.js'

// A real Rust excerpt from kedge (crates/kedge-mcp) — edit it and watch the
// compaction update live.
const DEFAULT = `impl RpcClient {
    /// Issue a request and await its response, bounded by the timeout.
    pub async fn request(&self, method: &str, params: Value) -> Result<Value> {
        if self.closed.load(Ordering::Acquire) {
            return Err(McpError::Closed);
        }
        let id = self.next_id.fetch_add(1, Ordering::Relaxed);
        let (tx, rx) = oneshot::channel();
        self.pending.lock().unwrap().insert(id, tx);
        let req = RpcRequest { jsonrpc: "2.0", id: Some(id), method, params };
        self.write_line(serde_json::to_vec(&req)?).await?;
        let timeout = Duration::from_millis(
            self.request_timeout_ms.load(Ordering::Relaxed),
        );
        match tokio::time::timeout(timeout, rx).await {
            Ok(Ok(resp)) => Self::into_result(resp),
            Ok(Err(_)) => Err(McpError::ConnectionClosed(id)),
            Err(_) => Err(McpError::Timeout {
                method: method.to_string(),
                secs: timeout.as_secs(),
            }),
        }
    }

    /// Fire a notification (no id, no response awaited).
    pub async fn notify(&self, method: &str, params: Value) -> Result<()> {
        let req = RpcRequest { jsonrpc: "2.0", id: None, method, params };
        self.write_line(serde_json::to_vec(&req)?).await
    }
}`

const fmtBytes = (n) => (n / (1024 * 1024)).toFixed(2) + ' MB'

export default function LiveCompactor() {
  const [ready, setReady] = useState(false)
  const [err, setErr] = useState(false)
  const [code, setCode] = useState(DEFAULT)
  const [out, setOut] = useState(null)
  const parserRef = useRef(null)
  const wasmBytesRef = useRef(0)
  const timer = useRef(0)

  useEffect(() => {
    let alive = true
    loadRustParser()
      .then(({ parser, wasmBytes }) => {
        if (!alive) return
        parserRef.current = parser
        wasmBytesRef.current = wasmBytes
        setReady(true)
        setOut(compact(parser, DEFAULT))
      })
      .catch(() => alive && setErr(true))
    return () => { alive = false }
  }, [])

  // debounce recompute while typing
  useEffect(() => {
    if (!ready || !parserRef.current) return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      try { setOut(compact(parserRef.current, code)) } catch { /* ignore parse hiccup */ }
    }, 120)
    return () => clearTimeout(timer.current)
  }, [code, ready])

  const saved = out ? out.origTokens - out.compTokens : 0
  const pct = out && out.origTokens ? Math.round((saved / out.origTokens) * 1000) / 10 : 0

  return (
    <section className="xs-section lc-section" id="substrate">
      <div className="xs-section-head">
        <span className="xs-section-kicker">The live substrate</span>
        <h2 className="xs-h2">AST compaction, running in your browser.</h2>
        <p className="lc-sub">
          Official <b>Tree-sitter compiled to WebAssembly</b> parses the Rust you type; it then
          applies the same signature-preserving elision <b>kedge</b> uses — deterministic, no LLM,
          no server. Edit the code; the numbers are measured live.
        </p>
      </div>

      <div className="lc">
        <div className="lc-bar">
          <span className={`lc-stat ${err ? 'err' : ready ? 'ok' : ''}`}>
            <span className="lc-led" />{err ? 'engine failed' : ready ? 'tree-sitter · wasm' : 'loading engine…'}
          </span>
          <span className="lc-stat"><b>{out ? saved.toLocaleString() : '—'}</b> tokens saved <i>est.</i></span>
          <span className="lc-stat"><b>{pct || '—'}%</b> reduction</span>
          <span className="lc-stat"><b>{out ? out.ms.toFixed(2) : '—'} ms</b> compaction</span>
          <span className="lc-stat"><b>{ready ? fmtBytes(wasmBytesRef.current) : '—'}</b> wasm footprint</span>
          <span className="lc-stat"><b>{out ? out.elided : '—'}</b> bodies elided</span>
        </div>
        <div className="lc-panes">
          <div className="lc-pane">
            <div className="lc-label">raw source — editable</div>
            <textarea
              className="lc-code lc-input" spellCheck={false} value={code}
              onChange={(e) => setCode(e.target.value)}
              aria-label="Rust source to compact"
            />
          </div>
          <div className="lc-pane">
            <div className="lc-label">kedge-compacted — signatures kept</div>
            <pre className="lc-code lc-output"><code>{err ? '// engine failed to load' : out ? out.compacted : '// parsing…'}</code></pre>
          </div>
        </div>
      </div>
    </section>
  )
}
