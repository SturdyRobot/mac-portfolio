// ═══════════════════════════════════════════════════════════════════
//  SCOPE ENGINE — client-side PDF quote.
//  jsPDF is dynamically imported, so it's a separate chunk that only
//  loads when someone actually downloads a quote (keeps first paint light).
// ═══════════════════════════════════════════════════════════════════

const usd = (n) => `$${Math.round(n).toLocaleString('en-US')}`
const range = (r) => `${usd(r.low)} – ${usd(r.high)}`
const weeks = (r) => (r.low === r.high ? `${r.low} weeks` : `${r.low}–${r.high} weeks`)

const INK = [17, 24, 39]        // near-black
const MUTE = [107, 114, 128]    // grey
const ACCENT = [37, 99, 235]    // blue

/**
 * Generate and download a branded PDF quote.
 * @param {import('zod').infer<typeof import('./schema.js').Scope>} scope
 * @param {import('zod').infer<typeof import('./schema.js').Intake>} intake
 */
export async function downloadQuote(scope, intake) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const M = 48
  let y = 56

  const setColor = (c) => doc.setTextColor(c[0], c[1], c[2])
  const date = new Date(scope.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  // ── header ──
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); setColor(INK)
  doc.text('Project Scope', M, y)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); setColor(MUTE)
  doc.text(date, W - M, y, { align: 'right' })
  y += 18
  setColor(ACCENT); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
  doc.text('Sturdy Robot · Noel Jackson', M, y)
  setColor(MUTE); doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
  doc.text('noeljacksonjs@gmail.com  ·  sturdyrobot.io', W - M, y, { align: 'right' })
  y += 14
  doc.setDrawColor(ACCENT[0], ACCENT[1], ACCENT[2]); doc.setLineWidth(1.5)
  doc.line(M, y, W - M, y); y += 26

  // ── prepared for ──
  const c = intake.contact
  if (c.name || c.company || c.email) {
    setColor(MUTE); doc.setFontSize(9); doc.text('PREPARED FOR', M, y); y += 14
    setColor(INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
    doc.text([c.name, c.company].filter(Boolean).join('  ·  ') || c.email, M, y); y += 13
    if (c.email && (c.name || c.company)) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); setColor(MUTE); doc.text(c.email, M, y); y += 13
    }
    y += 10
  }

  // ── summary ──
  setColor(INK); doc.setFont('helvetica', 'normal'); doc.setFontSize(11)
  doc.splitTextToSize(scope.summary, W - M * 2).forEach((line) => { doc.text(line, M, y); y += 15 })
  y += 12

  // ── line items ──
  setColor(MUTE); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.text('SCOPE OF WORK', M, y)
  doc.text('HOURS', W - M - 120, y, { align: 'right' })
  doc.text('ESTIMATE', W - M, y, { align: 'right' })
  y += 8
  doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.75); doc.line(M, y, W - M, y); y += 16

  doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5)
  scope.lineItems.forEach((li) => {
    setColor(INK); doc.text(doc.splitTextToSize(li.label, W - M * 2 - 150)[0], M, y)
    setColor(MUTE); doc.text(String(li.hours), W - M - 120, y, { align: 'right' })
    setColor(INK); doc.text(usd(li.cost), W - M, y, { align: 'right' })
    y += 18
  })
  y += 4; doc.setDrawColor(226, 232, 240); doc.line(M, y, W - M, y); y += 22

  // ── estimate box ──
  const boxH = 74
  doc.setFillColor(247, 249, 252); doc.roundedRect(M, y, W - M * 2, boxH, 6, 6, 'F')
  const bx = M + 20, by = y + 26
  setColor(MUTE); doc.setFontSize(9); doc.text('ESTIMATED INVESTMENT', bx, by)
  setColor(INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text(range(scope.total), bx, by + 26)
  setColor(MUTE); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text('TIMELINE', W - M - 20, by, { align: 'right' })
  setColor(INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text(weeks(scope.weeks), W - M - 20, by + 26, { align: 'right' })
  y += boxH + 18
  if (scope.monthly) {
    setColor(MUTE); doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
    doc.text(`Optional ongoing maintenance: ${usd(scope.monthly)}/month`, M, y); y += 22
  }

  // ── assumptions ──
  setColor(MUTE); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text('ASSUMPTIONS', M, y); y += 15
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5)
  scope.assumptions.forEach((a) => {
    doc.splitTextToSize(`•  ${a}`, W - M * 2).forEach((line) => { doc.text(line, M, y); y += 13 })
  })

  // ── footer ──
  setColor(MUTE); doc.setFontSize(8.5)
  doc.text('Estimate valid for 30 days · Deterministic scope engine · sturdyrobot.io', M, doc.internal.pageSize.getHeight() - 32)

  const who = (intake.contact.company || intake.contact.name || 'project').replace(/[^\w-]+/g, '-').toLowerCase()
  doc.save(`scope-${who}.pdf`)
}
