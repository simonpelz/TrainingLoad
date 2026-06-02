// Public API for the training-load engine.
export type { Activity, MetricsPoint, ComputeOptions } from './types'
export { ewma } from './ewma'
export { aggregateDaily } from './aggregate'
export { computeMetrics, DEFAULT_TAU_CTL, DEFAULT_TAU_ATL } from './metrics'
export { parseCsv, toActivities, type ParsedCsv } from './csv'
export { dedupeActivities, activityStats, type ActivityStats } from './combine'
export { generateSampleActivities, type SampleOptions } from './sample'
export { toDayKey, normalizeDayKey, addDays, enumerateDays } from './dates'
