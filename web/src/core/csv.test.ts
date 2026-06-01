import { describe, expect, it } from 'vitest'
import { parseCsv, toActivities } from './csv'
import { aggregateDaily } from './aggregate'
import { computeMetrics } from './metrics'
import { generateSampleActivities } from './sample'

// A trimmed TrainingPeaks-style export (quoted, many extra columns).
const TP_CSV = `"Title","WorkoutType","WorkoutDay","DistanceInMeters","TSS","Rpe"
"Road Cycling","Bike","2024-01-01","65797","80","5"
"Cardio","Other","2024-01-01","0","","3"
"Road Cycling","Bike","2024-01-03","14626","100",""
"Run","Run","2024-01-05","8000","60","6"
`

describe('parseCsv', () => {
  it('auto-detects the WorkoutDay and TSS columns', () => {
    const parsed = parseCsv(TP_CSV)
    expect(parsed.dateColumn).toBe('WorkoutDay')
    expect(parsed.tssColumn).toBe('TSS')
    expect(parsed.rows).toHaveLength(4)
  })

  it('detects fuzzy headers (Date / Training Load)', () => {
    const parsed = parseCsv('Date,Training Load\n2024-01-01,42\n')
    expect(parsed.dateColumn).toBe('Date')
    expect(parsed.tssColumn).toBe('Training Load')
  })

  it('round-trips through the full pipeline with blank TSS = 0', () => {
    const parsed = parseCsv(TP_CSV)
    const activities = toActivities(parsed, parsed.dateColumn!, parsed.tssColumn!)
    const metrics = computeMetrics(aggregateDaily(activities))
    expect(metrics[0].date).toBe('2024-01-01')
    expect(metrics[0].tss).toBe(80) // 80 + blank(0)
    expect(metrics.at(-1)!.date).toBe('2024-01-05')
  })
})

describe('generateSampleActivities', () => {
  it('is deterministic and spans the requested window', () => {
    const a = generateSampleActivities({ days: 120, endDate: '2024-06-01', seed: 1 })
    const b = generateSampleActivities({ days: 120, endDate: '2024-06-01', seed: 1 })
    expect(a).toEqual(b)
    expect(a.length).toBeGreaterThan(40)
    const daily = aggregateDaily(a)
    const metrics = computeMetrics(daily, { futureDays: 14 })
    expect(metrics.some((p) => p.isForecast)).toBe(true)
    expect(metrics.every((p) => Number.isFinite(p.ctl))).toBe(true)
  })
})
