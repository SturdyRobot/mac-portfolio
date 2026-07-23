// ═══════════════════════════════════════════════════════════════════
//  PROJECT BRIEF — client-side PDF.
//  jsPDF is dynamically imported, so it's a separate chunk that only
//  loads when someone downloads a brief (keeps first paint light).
//  No prices — this is a summary of what the client wants.
// ═══════════════════════════════════════════════════════════════════
import { BUDGET_BY_ID, DEADLINE_BY_ID } from './catalog.js'

const INK = [17, 24, 39]
const MUTE = [107, 114, 128]
const ACCENT = [37, 99, 235]

/**
 * Generate and download a branded project brief.
 * @param {import('zod').infer<typeof import('./schema.js').Brief>} brief
 * @param {import('zod').infer<typeof import('./schema.js').Intake>} intake
 * @param {Record<number, string>} [answers] answers to the AI follow-up questions
 */
export async function downloadBrief(brief, intake, answers = {}) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const M = 48
  let y = 56

  const setColor = (c) => doc.setTextColor(c[0], c[1], c[2])
  const date = new Date(brief.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const budgetLabel = brief.budget ? BUDGET_BY_ID[brief.budget].label : 'Not specified'
  const deadlineLabel = brief.deadline ? DEADLINE_BY_ID[brief.deadline].label : 'Not specified'

  // ── header ──
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); setColor(INK)
  doc.text('Project Brief', M, y)
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
    setColor(MUTE); doc.setFontSize(9); doc.text('FROM', M, y); y += 14
    setColor(INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
    doc.text([c.name, c.company].filter(Boolean).join('  ·  ') || c.email, M, y); y += 13
    if (c.email && (c.name || c.company)) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); setColor(MUTE); doc.text(c.email, M, y); y += 13
    }
    y += 10
  }

  // ── summary ──
  setColor(INK); doc.setFont('helvetica', 'normal'); doc.setFontSize(11)
  doc.splitTextToSize(brief.summary, W - M * 2).forEach((line) => { doc.text(line, M, y); y += 15 })
  y += 12

  // ── budget + timeline ──
  const boxH = 62
  doc.setFillColor(247, 249, 252); doc.roundedRect(M, y, W - M * 2, boxH, 6, 6, 'F')
  const by = y + 24
  setColor(MUTE); doc.setFontSize(9); doc.text('BUDGET', M + 20, by)
  setColor(INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.text(budgetLabel, M + 20, by + 22)
  setColor(MUTE); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text('TIMELINE', W - M - 20, by, { align: 'right' })
  setColor(INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.text(deadlineLabel, W - M - 20, by + 22, { align: 'right' })
  y += boxH + 20

  // ── what's involved ──
  setColor(MUTE); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text('WHAT’S TYPICALLY INVOLVED', M, y); y += 8
  doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.75); doc.line(M, y, W - M, y); y += 16
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); setColor(INK)
  brief.lineItems.forEach((li) => { doc.text(`•  ${li.label}`, M, y); y += 17 })
  y += 8

  // ── what I'll need from you ──
  if (brief.needs?.length) {
    setColor(MUTE); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text('WHAT I’LL NEED FROM YOU', M, y); y += 15
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); setColor(INK)
    brief.needs.forEach((n) => {
      doc.splitTextToSize(`•  ${n}`, W - M * 2).forEach((line) => { doc.text(line, M, y); y += 14 })
    })
    y += 8
  }

  // ── answered follow-ups ──
  const answered = brief.questions
    .map((q, i) => ({ q, a: String(answers[i] || '').trim() }))
    .filter((x) => x.a)
  if (answered.length) {
    setColor(MUTE); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text('FOLLOW-UPS', M, y); y += 15
    answered.forEach(({ q, a }) => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); setColor(INK)
      doc.splitTextToSize(q, W - M * 2).forEach((line) => { doc.text(line, M, y); y += 13 })
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); setColor(MUTE)
      doc.splitTextToSize(a, W - M * 2).forEach((line) => { doc.text(line, M, y); y += 13 })
      y += 6
    })
    y += 4
  }

  // ── client notes ──
  if (intake.brief) {
    setColor(MUTE); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text('NOTES', M, y); y += 15
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); setColor(INK)
    doc.splitTextToSize(intake.brief, W - M * 2).forEach((line) => { doc.text(line, M, y); y += 14 })
    y += 10
  }

  // ── how I work ──
  setColor(MUTE); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text('HOW I WORK', M, y); y += 15
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5)
  brief.assumptions.forEach((a) => {
    doc.splitTextToSize(`•  ${a}`, W - M * 2).forEach((line) => { doc.text(line, M, y); y += 13 })
  })

  // ── footer ──
  setColor(MUTE); doc.setFontSize(8.5)
  doc.text('Let’s talk specifics · sturdyrobot.io · noeljacksonjs@gmail.com', M, doc.internal.pageSize.getHeight() - 32)

  const who = (intake.contact.company || intake.contact.name || 'project').replace(/[^\w-]+/g, '-').toLowerCase()
  doc.save(`brief-${who}.pdf`)
}
