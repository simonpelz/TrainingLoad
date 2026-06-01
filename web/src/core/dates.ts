/**
 * Day-key helpers. A "day key" is a calendar day as `YYYY-MM-DD`.
 * All arithmetic is done in UTC so it is immune to local timezones and DST.
 */

/** Format a Date as a `YYYY-MM-DD` day key (UTC). */
export function toDayKey(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Normalise an arbitrary date input to a day key, or return null if it can't
 * be parsed. ISO-ish `YYYY-MM-DD[...]` is handled directly; anything else
 * falls back to `Date.parse` and is read in UTC.
 */
export function normalizeDayKey(input: string | Date): string | null {
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : toDayKey(input)
  }
  const s = input.trim()
  if (!s) return null
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const t = Date.parse(s)
  if (Number.isNaN(t)) return null
  return toDayKey(new Date(t))
}

const MS_PER_DAY = 86_400_000

function keyToUtcMs(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/** Return a new day key `n` days after `key` (n may be negative). */
export function addDays(key: string, n: number): string {
  return toDayKey(new Date(keyToUtcMs(key) + n * MS_PER_DAY))
}

/** Every day key from `startKey` to `endKey` inclusive. */
export function enumerateDays(startKey: string, endKey: string): string[] {
  const out: string[] = []
  const end = keyToUtcMs(endKey)
  for (let t = keyToUtcMs(startKey); t <= end; t += MS_PER_DAY) {
    out.push(toDayKey(new Date(t)))
  }
  return out
}
