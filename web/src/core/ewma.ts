/**
 * Recursive exponentially-weighted moving average, matching the reference
 * Python implementation exactly:
 *
 *   alpha       = 1 - exp(-1 / tau)
 *   value[i]    = value[i-1] + alpha * (x[i] - value[i-1])   (seeded at 0)
 *
 * @param values daily input series (e.g. daily TSS)
 * @param tau    time constant in days (must be > 0)
 */
export function ewma(values: number[], tau: number): number[] {
  if (tau <= 0) throw new Error('tau must be positive')
  const alpha = 1 - Math.exp(-1 / tau)
  const out = new Array<number>(values.length)
  let prev = 0
  for (let i = 0; i < values.length; i++) {
    const curr = prev + alpha * (values[i] - prev)
    out[i] = curr
    prev = curr
  }
  return out
}
