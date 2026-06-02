import type { Activity } from './types'
import { addDays, toDayKey } from './dates'

/** Deterministic PRNG (mulberry32) so the sample dataset is reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface SampleOptions {
  /** Number of days of history to generate (default 540 ~ 18 months). */
  days?: number
  /** Last day of the dataset as a `YYYY-MM-DD` key (default: today, UTC). */
  endDate?: string
  /** PRNG seed (default 42). */
  seed?: number
}

/**
 * Generate a realistic-looking synthetic training history for the demo /
 * "Try sample data" button. No real personal data is involved.
 *
 * The shape: an endurance athlete's week (easy weekdays, a long weekend ride,
 * ~2 rest days), with build/recovery cycles and a 10-day taper at the end so
 * the form (TSB) curve swings nicely positive, which looks good in a screenshot.
 */
export function generateSampleActivities(opts: SampleOptions = {}): Activity[] {
  const { days = 540, endDate = toDayKey(new Date()), seed = 42 } = opts
  const rand = mulberry32(seed)
  const startKey = addDays(endDate, -(days - 1))

  const activities: Activity[] = []
  for (let i = 0; i < days; i++) {
    const key = addDays(startKey, i)
    const daysFromEnd = days - 1 - i
    const dow = new Date(`${key}T00:00:00Z`).getUTCDay() // 0 = Sun

    // Long build-and-recover cycle: a slow seasonal swell plus a 4-week block.
    const season = 0.8 + 0.25 * Math.sin((i / days) * Math.PI * 2)
    const block = 1 - 0.35 * (Math.floor(i / 7) % 4 === 3 ? 1 : 0) // every 4th week easier
    const taper = daysFromEnd < 10 ? 0.4 : 1 // ease off at the very end

    let tss = 0
    if (dow === 0 || dow === 6) {
      // Weekend: long session (skip ~15% of the time).
      if (rand() > 0.15) tss = (90 + rand() * 70) * season * block * taper
    } else if (dow === 1 || dow === 4) {
      // Mon/Thu: easy or rest.
      if (rand() > 0.45) tss = (35 + rand() * 35) * season * block * taper
    } else {
      // Tue/Wed/Fri: moderate-hard quality days.
      if (rand() > 0.2) tss = (55 + rand() * 60) * season * block * taper
    }

    if (tss > 0) activities.push({ date: key, tss: Math.round(tss * 10) / 10 })
  }
  return activities
}
