// ═══════════════════════════════════════════════════════════════════
//  RÉSUMÉ — a clean one-page PDF, generated client-side.
//  jsPDF is dynamically imported so it's a separate chunk that only loads
//  when someone actually downloads. Recruiters need one artifact they can
//  forward — this is it.
// ═══════════════════════════════════════════════════════════════════

const INK = [17, 24, 39]
const MUTE = [107, 114, 128]
const ACCENT = [37, 99, 235]

export async function downloadResume() {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const W = doc.internal.pageSize.getWidth()
  const M = 54
  let y = 64

  const text = (s, x, opts = {}) => {
    doc.setFont('helvetica', opts.style || 'normal')
    doc.setFontSize(opts.size || 10)
    doc.setTextColor(...(opts.color || INK))
    doc.text(s, x, y)
  }
  const line = () => {
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.8)
    doc.line(M, y, W - M, y)
  }
  const gap = (n) => { y += n }

  // ── header ──
  text('Noel Jackson', M, { size: 22, style: 'bold' })
  gap(18)
  text('Systems & AI Infrastructure Engineer', M, { size: 12, color: ACCENT })
  gap(15)
  text('noel@nlj.dev   ·   nlj.dev   ·   github.com/nlj3', M, { size: 9.5, color: MUTE })
  gap(16); line(); gap(20)

  // ── summary ──
  const summary =
    'I build deterministic Rust runtimes, WASM execution engines, and AI infrastructure — ' +
    'high-assurance systems from the kernel to the edge. I ship production software solo: I own the ' +
    'architecture, direct AI to implement against contracts I design, and verify every change before it lands.'
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...INK)
  doc.splitTextToSize(summary, W - M * 2).forEach((ln) => { doc.text(ln, M, y); gap(14) })
  gap(8)

  const section = (title) => { text(title, M, { size: 11, style: 'bold', color: ACCENT }); gap(6); line(); gap(16) }
  const item = (title, sub, bullets) => {
    text(title, M, { size: 10.5, style: 'bold' })
    if (sub) { doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(...MUTE); doc.text(sub, W - M, y, { align: 'right' }) }
    gap(15)
    bullets.forEach((b) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...INK)
      doc.splitTextToSize('•  ' + b, W - M * 2 - 8).forEach((ln, i) => { doc.text(ln, M + (i ? 10 : 0), y); gap(13) })
    })
    gap(6)
  }

  // ── selected work ──
  section('Selected Work')
  item('Kedge — deterministic AI-agent harness', 'Rust · WebAssembly · 17 crates', [
    'A safety harness that classifies every agent action before it runs — read-only allowed, anything mutating intercepted — with byte-identical deterministic replay so a run’s effect is verifiable.',
    'Core classifier compiled to WebAssembly and running live in-browser; published to crates.io (15 crates).',
  ])
  item('WorldFrame — desktop worldbuilding app', 'Tauri · Rust · shipped', [
    'Built and shipped end-to-end, solo: Ed25519 licensing, hard online verification, auto-update proven in production, and an E2EE cloud-sync vault on Cloudflare R2.',
  ])
  item('nlj.dev — this site', 'React · WASM · Cloudflare Workers', [
    'A working retro OS in the browser; every app is real, including a terminal that runs the real Kedge engine and a prompt-injection-hardened LLM proxy at the edge.',
  ])

  // ── skills ──
  section('Skills')
  const skills = [
    ['Languages', 'Rust · TypeScript · JavaScript · Python'],
    ['Systems', 'WebAssembly · eBPF · Tree-sitter · SQLite'],
    ['AI infra', 'LLM agent harnesses · RAG · MCP protocol · prompt-injection defense'],
    ['Edge / Web', 'Cloudflare Workers · React · Tauri · Vite'],
  ]
  skills.forEach(([k, v]) => {
    text(k, M, { size: 9.5, style: 'bold' })
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...INK)
    doc.text(v, M + 78, y)
    gap(15)
  })

  // ── footer ──
  gap(10)
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8.5); doc.setTextColor(...MUTE)
  doc.text('Generated from nlj.dev — the whole site is a working OS I built.', M, y)

  doc.save('Noel-Jackson-Resume.pdf')
}
