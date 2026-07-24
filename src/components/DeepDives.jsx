import './deepdives.css'

// Three staff-level design notes, grounded in the real kedge architecture.
// Essay 3 is deliberately honest about what's shipped vs. comparative analysis.
const ESSAYS = [
  {
    n: '01',
    tag: 'compaction · agents',
    title: 'The Skeleton-Edit Paradox',
    tldr: 'How signature-preserving elision lets an agent navigate a huge file compacted — then edit it precisely, without re-sending it.',
    body: [
      { h: 'The problem', p: 'To fit a large source file in an agent’s context, kedge-compact elides function bodies and keeps the signatures — the skeleton. But an agent asked to change a body only sees { /* 54 lines elided */ }. It can’t patch code it can’t see. Re-sending the whole file defeats the compaction; leaving it elided makes the edit impossible. That is the skeleton-edit paradox.' },
      { h: 'The approach', p: 'Compaction is reversible and addressable. collect_body_elisions records, for every elided body, the exact source span it replaced — so any single symbol can be re-expanded on demand (kedge expand <symbol>) without re-hydrating the file. The agent reasons against the skeleton to navigate, and JIT-decompacts only the one function it is about to touch. Signatures are never elided, so the call graph and types stay legible even at full compaction.' },
      { h: 'Why it holds', p: 'Expansion is a lookup against a content-addressable cache (kedge-cache), so after the first parse re-expanding a symbol is effectively free. The only extra state is the span map, which is tiny next to the tokens saved. And because compaction is a pure function of the source — same input, same skeleton, same spans — the whole thing stays deterministic.' },
    ],
  },
  {
    n: '02',
    tag: 'determinism · ledger',
    title: 'Verifiable, not vibes',
    tldr: 'Why a SQLite-WAL event ledger — not a log file — is what makes an autonomous agent loop reproducible, bounded, and auditable.',
    body: [
      { h: 'The problem', p: 'Autonomous loops are non-deterministic: the same prompt takes a different trajectory each run, with no way to prove what happened or reproduce a failure. "It worked on my run" is not an engineering standard, and an unbounded loop is a blank cheque against a token budget.' },
      { h: 'The approach', p: 'Every step of the ReAct loop (kedge-core) is journaled as an append-only event to a SQLite ledger in WAL mode (kedge-ledger): the observation, the tool call, the token cost, the budget remaining. A run is not described — it is recorded. From that journal, kedge-eval replays a trajectory byte-for-byte and diffs it against a baseline, turning "did this change behaviour?" into a mechanical check. Budgets are enforced in-loop against the ledger’s running total, so a runaway agent is halted at a hard ceiling, not discovered on the invoice.' },
      { h: 'The trade', p: 'Journaling every step costs a synchronous write — but WAL makes those writes cheap and keeps reads concurrent, and the payoff (reproducibility, cost caps, and forensic audit via kedge-audit) is exactly the line between a demo and infrastructure.' },
    ],
  },
  {
    n: '03',
    tag: 'isolation · security',
    title: 'Where the sandbox ends',
    tldr: 'A layered look at isolating agent tools — user-space policy, process groups, and (experimental) kernel eBPF — with an honest map of what’s shipped vs. analysed.',
    body: [
      { h: 'The problem', p: 'An agent that can run tools can run dangerous tools. Where you draw the isolation boundary decides what a compromised or merely confused agent can actually do to the host.' },
      { h: 'What kedge ships', p: 'First line, user space: kedge-policy blocks disallowed tools and redacts PII before a call is made, and kedge-audit’s Shadow-Guard runs mutating actions as dry-runs first — fail-safe, so anything not provably read-only is intercepted rather than executed. Process isolation: kedge-exec runs subprocesses in their own process groups so a spawned tool can be torn down cleanly. Kernel, experimental (Linux): kedge-probe uses an eBPF LSM via aya to supervise behaviour below user space — the strongest boundary, but Linux-only and still experimental.' },
      { h: 'The comparison (analysis, not a claim)', p: 'Wasmtime gives memory sandboxing for wasm tools — no ambient authority over the host. seccomp-bpf filters which syscalls a process may make. Landlock restricts filesystem access, unprivileged. These are complementary — memory, syscall, and filesystem boundaries — and the right stack depends on the tool. kedge’s shipped isolation today is the user-space + process + experimental-eBPF layers above; the Wasmtime / seccomp / Landlock comparison is design analysis, not a claim that all three are wired in right now.' },
    ],
  },
]

export default function DeepDives() {
  return (
    <section className="xs-section" id="writing">
      <div className="xs-section-head">
        <span className="xs-section-kicker">Engineering notes</span>
        <h2 className="xs-h2">Design docs, not project cards.</h2>
      </div>
      <div className="dd">
        {ESSAYS.map((e) => (
          <details key={e.n} className="dd-item">
            <summary className="dd-summary">
              <span className="dd-n">{e.n}</span>
              <span className="dd-head">
                <span className="dd-tag">{e.tag}</span>
                <span className="dd-title">{e.title}</span>
                <span className="dd-tldr">{e.tldr}</span>
              </span>
              <span className="dd-caret">read →</span>
            </summary>
            <div className="dd-body">
              {e.body.map((b, i) => (
                <div className="dd-block" key={i}>
                  <div className="dd-b-h">{b.h}</div>
                  <p className="dd-b-p">{b.p}</p>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
