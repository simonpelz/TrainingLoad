import { describe, expect, it } from 'vitest'
import { parseCsv, toActivities } from './csv'
import { dedupeActivities, activityStats } from './combine'
import { aggregateDaily } from './aggregate'

// Two single-year exports that overlap on 2024-01-02.
const FILE_A = `WorkoutDay,TSS
2024-01-01,80
2024-01-02,50
`
const FILE_B = `WorkoutDay,TSS
2024-01-02,50
2024-01-03,70
`

function activitiesOf(csv: string) {
  const p = parseCsv(csv)
  return toActivities(p, p.dateColumn!, p.tssColumn!)
}

describe('dedupeActivities', () => {
  it('drops exact-duplicate rows from overlapping files (no double count)', () => {
    const combined = dedupeActivities([...activitiesOf(FILE_A), ...activitiesOf(FILE_B)])
    const daily = aggregateDaily(combined)
    expect(daily.get('2024-01-01')).toBe(80)
    expect(daily.get('2024-01-02')).toBe(50) // not 100
    expect(daily.get('2024-01-03')).toBe(70)
    expect(daily.size).toBe(3)
  })

  it('keeps distinct same-day activities (different rows)', () => {
    const day = `WorkoutDay,Title,TSS
2024-01-02,Morning ride,50
2024-01-02,Evening run,30
`
    const daily = aggregateDaily(dedupeActivities(activitiesOf(day)))
    expect(daily.get('2024-01-02')).toBe(80) // both kept and summed
  })

  it('never dedupes activities without a key', () => {
    const a = [
      { date: '2024-01-01', tss: 10 },
      { date: '2024-01-01', tss: 10 },
    ]
    expect(dedupeActivities(a)).toHaveLength(2)
  })
})

describe('activityStats', () => {
  it('reports day count and date range', () => {
    const s = activityStats(activitiesOf(FILE_A))
    expect(s.days).toBe(2)
    expect(s.start).toBe('2024-01-01')
    expect(s.end).toBe('2024-01-02')
  })

  it('handles empty input', () => {
    expect(activityStats([])).toEqual({ days: 0, start: null, end: null })
  })
})
