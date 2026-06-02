import Papa from 'papaparse'
import type { Activity } from './types'

export interface ParsedCsv {
  /** Column headers as they appear in the file. */
  columns: string[]
  /** Raw rows keyed by header. */
  rows: Record<string, string>[]
  /** Best guess at the date column (or null if none matched). */
  dateColumn: string | null
  /** Best guess at the TSS column (or null if none matched). */
  tssColumn: string | null
}

const DATE_HINTS = ['workoutday', 'date', 'day', 'timestamp', 'starttime', 'start']
const TSS_HINTS = ['tss', 'trainingstressscore', 'trainingload', 'load', 'score']

/** Lowercase and strip spaces/underscores for fuzzy header matching. */
function canon(s: string): string {
  return s.toLowerCase().replace(/[\s_]+/g, '')
}

/** Pick the column whose canonical name best matches the given hints. */
function pickColumn(columns: string[], hints: string[]): string | null {
  const canonCols = columns.map((c) => ({ raw: c, key: canon(c) }))
  // Exact match first (e.g. "WorkoutDay" becomes "workoutday").
  for (const hint of hints) {
    const exact = canonCols.find((c) => c.key === hint)
    if (exact) return exact.raw
  }
  // Then substring match (e.g. "Avg TSS" contains "tss").
  for (const hint of hints) {
    const partial = canonCols.find((c) => c.key.includes(hint))
    if (partial) return partial.raw
  }
  return null
}

/** Parse CSV text and auto-detect the date and TSS columns. */
export function parseCsv(text: string): ParsedCsv {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })
  const columns = result.meta.fields ?? []
  return {
    columns,
    rows: result.data,
    dateColumn: pickColumn(columns, DATE_HINTS),
    tssColumn: pickColumn(columns, TSS_HINTS),
  }
}

/**
 * Project parsed rows into activities using the chosen columns. Rows with a
 * blank/unparseable date are skipped; blank/non-numeric TSS becomes 0.
 */
export function toActivities(parsed: ParsedCsv, dateColumn: string, tssColumn: string): Activity[] {
  const activities: Activity[] = []
  for (const row of parsed.rows) {
    const dateRaw = row[dateColumn]
    if (dateRaw == null || dateRaw.trim() === '') continue
    const tss = Number.parseFloat(row[tssColumn])
    // The full row is the dedupe signature: identical activities appearing in
    // two overlapping exports stringify the same and collapse to one.
    activities.push({
      date: dateRaw,
      tss: Number.isFinite(tss) ? tss : 0,
      key: JSON.stringify(row),
    })
  }
  return activities
}
