import { describe, expect, it } from 'vitest'
import { aggregateDaily } from './aggregate'

describe('aggregateDaily', () => {
  it('sums multiple activities on the same day and drops bad dates', () => {
    const daily = aggregateDaily([
      { date: '2024-01-01', tss: 50 },
      { date: '2024-01-01', tss: 30 }, // same day -> 80
      { date: '2024-01-03', tss: 100 },
      { date: '2024-01-05', tss: 60 },
      { date: '2024-01-05', tss: 0 },
      { date: 'not-a-date', tss: 999 }, // dropped
    ])
    expect(daily.get('2024-01-01')).toBe(80)
    expect(daily.get('2024-01-03')).toBe(100)
    expect(daily.get('2024-01-05')).toBe(60)
    expect(daily.size).toBe(3)
  })

  it('treats non-finite TSS as 0', () => {
    const daily = aggregateDaily([{ date: '2024-01-01', tss: Number.NaN }])
    expect(daily.get('2024-01-01')).toBe(0)
  })

  it('accepts Date objects', () => {
    const daily = aggregateDaily([{ date: new Date(Date.UTC(2024, 0, 2)), tss: 10 }])
    expect(daily.get('2024-01-02')).toBe(10)
  })
})
