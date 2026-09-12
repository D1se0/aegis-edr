/** Genera una insignia SVG (estilo shields.io) con el score de seguridad actual, exportable/copiable desde Ajustes. */

function colorForScore(score: number): string {
  if (score >= 90) return '#22d3ee' // aegis-cyan
  if (score >= 70) return '#4ade80'
  if (score >= 40) return '#facc15'
  return '#f87171'
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function buildScoreBadgeSvg(score: number, label: string): string {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const color = colorForScore(clamped)
  const leftText = 'Protegido por Aegis EDR'
  const rightText = `${clamped}/100 · ${label}`
  const leftWidth = 158
  const rightWidth = 92
  const width = leftWidth + rightWidth
  const height = 20

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" role="img" aria-label="${escapeXml(leftText)}: ${escapeXml(rightText)}">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${width}" height="${height}" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="${height}" fill="#05070d"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="${height}" fill="${color}"/>
    <rect width="${width}" height="${height}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${leftWidth / 2}" y="14">${escapeXml(leftText)}</text>
    <text x="${leftWidth + rightWidth / 2}" y="14" fill="#05070d">${escapeXml(rightText)}</text>
  </g>
</svg>`
}
