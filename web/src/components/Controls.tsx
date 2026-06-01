import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SeriesVisibility {
  tss: boolean
  ctl: boolean
  atl: boolean
  tsb: boolean
}

export type TimeframePreset = 'all' | '365' | '90' | '30'

const SERIES: { key: keyof SeriesVisibility; label: string; dot: string }[] = [
  { key: 'tss', label: 'TSS', dot: 'bg-muted-foreground' },
  { key: 'ctl', label: 'Fitness', dot: 'bg-fitness' },
  { key: 'atl', label: 'Fatigue', dot: 'bg-fatigue' },
  { key: 'tsb', label: 'Form', dot: 'bg-form' },
]

const TIMEFRAMES: { key: TimeframePreset; label: string }[] = [
  { key: '30', label: '30d' },
  { key: '90', label: '90d' },
  { key: '365', label: '1y' },
  { key: 'all', label: 'All' },
]

interface ControlsProps {
  tauCtl: number
  tauAtl: number
  futureDays: number
  onTau: (which: 'ctl' | 'atl', value: number) => void
  onFutureDays: (value: number) => void
  visible: SeriesVisibility
  onToggle: (key: keyof SeriesVisibility) => void
  timeframe: TimeframePreset
  onTimeframe: (tf: TimeframePreset) => void
  onReset: () => void
}

function NumberField({
  label,
  value,
  onChange,
  min = 1,
  max = 999,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  return (
    <label className="flex items-center gap-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (Number.isFinite(v)) onChange(Math.min(max, Math.max(min, v)))
        }}
        className="w-16 rounded-md border border-input bg-background px-2 py-1 tabular-nums"
      />
    </label>
  )
}

export function Controls(props: ControlsProps) {
  const {
    tauCtl,
    tauAtl,
    futureDays,
    onTau,
    onFutureDays,
    visible,
    onToggle,
    timeframe,
    onTimeframe,
    onReset,
  } = props

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-border bg-card p-3">
      {/* Series toggles */}
      <div className="flex flex-wrap items-center gap-3">
        {SERIES.map((s) => (
          <label key={s.key} className="flex cursor-pointer select-none items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={visible[s.key]}
              onChange={() => onToggle(s.key)}
              className="accent-form"
            />
            <span className={cn('size-2 rounded-full', s.dot)} />
            {s.label}
          </label>
        ))}
      </div>

      <div className="h-5 w-px bg-border" />

      {/* Timeframe presets */}
      <div className="inline-flex overflow-hidden rounded-md border border-border">
        {TIMEFRAMES.map((t) => (
          <button
            key={t.key}
            onClick={() => onTimeframe(t.key)}
            className={cn(
              'px-2.5 py-1 text-sm',
              timeframe === t.key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-border" />

      {/* Model parameters */}
      <NumberField label="τ Fitness" value={tauCtl} onChange={(v) => onTau('ctl', v)} max={365} />
      <NumberField label="τ Fatigue" value={tauAtl} onChange={(v) => onTau('atl', v)} max={365} />
      <NumberField label="Forecast" value={futureDays} onChange={onFutureDays} min={0} max={365} />

      <button
        onClick={onReset}
        title="Reset to defaults (42 / 7 / 30)"
        className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-sm hover:bg-muted"
      >
        <RotateCcw className="size-3.5" />
        Reset
      </button>
    </div>
  )
}
