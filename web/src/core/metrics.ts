import type { ComputeOptions, MetricsPoint } from './types'
import { ewma } from './ewma'
import { addDays, enumerateDays } from './dates'

export const DEFAULT_TAU_CTL = 42
export const DEFAULT_TAU_ATL = 7

/**
 * Compute the full daily CTL / ATL / TSB series from per-day TSS sums.
 *
 * Matches the Python pipeline: fill every calendar day between the first and
 * last day of activity with zero TSS, optionally append `futureDays` of zeros
 * for forecasting, then run the recursive EWMA over the whole range. Days
 * beyond the last real day are flagged `isForecast`.
 *
 * @param daily map of day key -> summed TSS (e.g. from {@link aggregateDaily})
 */
export function computeMetrics(
  daily: Map<string, number>,
  opts: ComputeOptions = {},
): MetricsPoint[] {
  const { tauCtl = DEFAULT_TAU_CTL, tauAtl = DEFAULT_TAU_ATL, futureDays = 0 } = opts
  if (daily.size === 0) return []

  const keys = [...daily.keys()].sort()
  const startKey = keys[0]
  const lastActual = keys[keys.length - 1]
  const endKey = futureDays > 0 ? addDays(lastActual, futureDays) : lastActual

  const days = enumerateDays(startKey, endKey)
  const tss = days.map((d) => daily.get(d) ?? 0)
  const ctl = ewma(tss, tauCtl)
  const atl = ewma(tss, tauAtl)

  return days.map((date, i) => ({
    date,
    tss: tss[i],
    ctl: ctl[i],
    atl: atl[i],
    tsb: ctl[i] - atl[i],
    isForecast: date > lastActual,
  }))
}
