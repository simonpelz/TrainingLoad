import type { MetricsPoint } from '@/core'

export type FormTone = 'fresh' | 'neutral' | 'tired' | 'risk'

export interface FormZone {
  label: string
  tone: FormTone
  description: string
}

/**
 * Plain-language reading of Training Stress Balance (form), using the
 * commonly-cited sports-science TSB bands.
 */
export function interpretForm(tsb: number): FormZone {
  if (tsb > 25)
    return {
      label: 'Very fresh',
      tone: 'fresh',
      description: 'Well rested — fitness may fade if this lasts too long.',
    }
  if (tsb > 5)
    return { label: 'Fresh', tone: 'fresh', description: 'Tapered and race-ready.' }
  if (tsb >= -10)
    return {
      label: 'Neutral',
      tone: 'neutral',
      description: 'Training and recovery are balanced.',
    }
  if (tsb >= -30)
    return {
      label: 'Productive',
      tone: 'tired',
      description: 'Carrying useful fatigue — fitness is building.',
    }
  return {
    label: 'Overreaching',
    tone: 'risk',
    description: 'High fatigue — prioritise recovery to avoid burnout.',
  }
}

/** Index of the last day with real (non-forecast) data, or -1 if none. */
export function lastActualIndex(metrics: MetricsPoint[]): number {
  for (let i = metrics.length - 1; i >= 0; i--) {
    if (!metrics[i].isForecast) return i
  }
  return -1
}

/** Round to a whole number (NaN-safe). */
export function round0(n: number): number {
  return Math.round(n)
}
