import type { MetricsPoint } from '@/core'

function r(n: number): string {
  return (Math.round(n * 100) / 100).toString()
}

/** Serialise computed metrics to a CSV string (re-importable by this app). */
export function metricsToCsv(metrics: MetricsPoint[]): string {
  const header = 'WorkoutDay,TSS,CTL,ATL,TSB,IsForecast'
  const rows = metrics.map((p) =>
    [p.date, r(p.tss), r(p.ctl), r(p.atl), r(p.tsb), p.isForecast].join(','),
  )
  return [header, ...rows].join('\n')
}

/** Trigger a client-side download of a text payload. */
export function downloadText(filename: string, text: string, mime = 'text/csv'): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
