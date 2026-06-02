/** A single training activity. `date` may be any parseable date string or a Date. */
export interface Activity {
  date: string | Date
  tss: number
  /**
   * Optional signature of the source row, used to drop exact duplicates when
   * stitching overlapping exports together. Activities without a key are never
   * treated as duplicates.
   */
  key?: string
}

/** One day of computed training-load metrics. */
export interface MetricsPoint {
  /** Calendar day, `YYYY-MM-DD`. */
  date: string
  /** Daily Training Stress Score (sum of all activities that day). */
  tss: number
  /** Chronic Training Load, i.e. "fitness". */
  ctl: number
  /** Acute Training Load, i.e. "fatigue". */
  atl: number
  /** Training Stress Balance (ctl minus atl), i.e. "form". */
  tsb: number
  /** True for projected days beyond the last day with real data. */
  isForecast: boolean
}

export interface ComputeOptions {
  /** CTL time constant in days (default 42). */
  tauCtl?: number
  /** ATL time constant in days (default 7). */
  tauAtl?: number
  /** Days to project forward (filled with zero TSS). Default 0. */
  futureDays?: number
}
