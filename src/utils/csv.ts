export function toCsv(rows: string[][]): string {
  const escape = (v: string) => (/[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  // Séparateur ";" et BOM : ouverture directe correcte dans Excel en français.
  return '﻿' + rows.map((r) => r.map(escape).join(';')).join('\r\n')
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
