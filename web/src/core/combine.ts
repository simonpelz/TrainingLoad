import type { Activity } from './types'
import { normalizeDayKey } from './dates'

/**
 * Concatenate activities from several files and drop exact duplicates so
 * overlapping date ranges (common when an app only exports one year at a time)
 * are not double-counted. Two activities collapse only when they carry the same
 * non-empty `key` (the stringified source row); genuinely distinct sessions on
 * the same day differ in at least one column and are kept. Activities without a
 * key are always kept.
 */
export function dedupeActivities(activities: Activity[]): Activity[] {
  const seen = new Set<string>()
  const out: Activity[] = []
  for (const a of activities) {
    if (a.key != null) {
      if (seen.has(a.key)) continue
      seen.add(a.key)
    }
    out.push(a)
  }
  return out
}

export interface ActivityStats {
  /** Number of distinct calendar days with activity. */
  days: number
  /** Earliest day key, or null if empty. */
  start: string | null
  /** Latest day key, or null if empty. */
  end: string | null
}

/** Summary (day count and date range) for a set of activities. */
export function activityStats(activities: Activity[]): ActivityStats {
  const days = new Set<string>()
  for (const a of activities) {
    const key = normalizeDayKey(a.date)
    if (key) days.add(key)
  }
  if (days.size === 0) return { days: 0, start: null, end: null }
  const sorted = [...days].sort()
  return { days: days.size, start: sorted[0], end: sorted[sorted.length - 1] }
}
