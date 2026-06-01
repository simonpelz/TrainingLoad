import type { Activity } from './types'
import { normalizeDayKey } from './dates'

/**
 * Sum TSS per calendar day across all activities. Mirrors the Python
 * `read_and_aggregate_multiple`: non-numeric/missing TSS counts as 0, and
 * rows with an unparseable date are dropped.
 *
 * @returns map of day key (`YYYY-MM-DD`) → summed TSS, for days with activity.
 */
export function aggregateDaily(activities: Activity[]): Map<string, number> {
  const daily = new Map<string, number>()
  for (const a of activities) {
    const key = normalizeDayKey(a.date)
    if (key === null) continue
    const tss = Number.isFinite(a.tss) ? a.tss : 0
    daily.set(key, (daily.get(key) ?? 0) + tss)
  }
  return daily
}
