import { describe, expect, it } from 'vitest'
import { ewma } from './ewma'

// Golden values produced by the reference Python implementation
// (desktop/training_load_app.py - ewma_recursive) over the filled series
// [80, 0, 100, 0, 60].
const SERIES = [80, 0, 100, 0, 60]

describe('ewma', () => {
  it('matches Python for tau = 7', () => {
    const expected = [10.64976802, 9.232048534, 21.3152688685, 18.4777355094, 24.0052665655]
    const got = ewma(SERIES, 7)
    got.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 8))
  })

  it('matches Python for tau = 42', () => {
    const expected = [1.8822650678, 1.8379785455, 4.1475653451, 4.0499801281, 5.3663897274]
    const got = ewma(SERIES, 42)
    got.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 8))
  })

  it('rejects non-positive tau', () => {
    expect(() => ewma(SERIES, 0)).toThrow()
    expect(() => ewma(SERIES, -1)).toThrow()
  })
})
