import { describe, expect, it } from 'vitest'
import { aggregateDaily } from './aggregate'
import { computeMetrics } from './metrics'
import type { MetricsPoint } from './types'

// Golden output from the reference Python implementation
// (desktop/training_load_app.py · extend_series_with_future, tau_ctl=42,
// tau_atl=7, future_days=3) for the same input activities used below.
const GOLDEN: MetricsPoint[] = [
  { date: '2024-01-01', tss: 80, ctl: 1.8822650678, atl: 10.64976802, tsb: -8.7675029522, isForecast: false },
  { date: '2024-01-02', tss: 0, ctl: 1.8379785455, atl: 9.232048534, tsb: -7.3940699885, isForecast: false },
  { date: '2024-01-03', tss: 100, ctl: 4.1475653451, atl: 21.3152688685, tsb: -17.1677035234, isForecast: false },
  { date: '2024-01-04', tss: 0, ctl: 4.0499801281, atl: 18.4777355094, tsb: -14.4277553813, isForecast: false },
  { date: '2024-01-05', tss: 60, ctl: 5.3663897274, atl: 24.0052665655, tsb: -18.6388768381, isForecast: false },
  { date: '2024-01-06', tss: 0, ctl: 5.2401276284, atl: 20.8096350632, tsb: -15.5695074349, isForecast: true },
  { date: '2024-01-07', tss: 0, ctl: 5.1168362635, atl: 18.0394127382, tsb: -12.9225764746, isForecast: true },
  { date: '2024-01-08', tss: 0, ctl: 4.9964457366, atl: 15.6379682272, tsb: -10.6415224906, isForecast: true },
]

describe('computeMetrics', () => {
  it('matches the Python pipeline exactly (incl. gap-fill and forecast)', () => {
    const daily = aggregateDaily([
      { date: '2024-01-01', tss: 50 },
      { date: '2024-01-01', tss: 30 },
      { date: '2024-01-03', tss: 100 },
      { date: '2024-01-05', tss: 60 },
      { date: '2024-01-05', tss: 0 },
    ])
    const got = computeMetrics(daily, { tauCtl: 42, tauAtl: 7, futureDays: 3 })

    expect(got).toHaveLength(GOLDEN.length)
    got.forEach((p, i) => {
      const g = GOLDEN[i]
      expect(p.date).toBe(g.date)
      expect(p.isForecast).toBe(g.isForecast)
      expect(p.tss).toBeCloseTo(g.tss, 8)
      expect(p.ctl).toBeCloseTo(g.ctl, 8)
      expect(p.atl).toBeCloseTo(g.atl, 8)
      expect(p.tsb).toBeCloseTo(g.tsb, 8)
    })
  })

  it('returns nothing for empty input', () => {
    expect(computeMetrics(new Map())).toEqual([])
  })

  it('fills gaps between activity days', () => {
    const daily = aggregateDaily([
      { date: '2024-03-01', tss: 50 },
      { date: '2024-03-04', tss: 50 },
    ])
    const got = computeMetrics(daily)
    expect(got.map((p) => p.date)).toEqual(['2024-03-01', '2024-03-02', '2024-03-03', '2024-03-04'])
    expect(got.every((p) => !p.isForecast)).toBe(true)
  })
})
