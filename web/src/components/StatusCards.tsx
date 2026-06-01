import { Activity, BatteryCharging, Gauge, TrendingDown, TrendingUp } from 'lucide-react'
import type { MetricsPoint } from '@/core'
import { interpretForm, lastActualIndex, round0, type FormTone } from '@/lib/interpretation'
import { cn } from '@/lib/utils'

const TONE_CLASS: Record<FormTone, string> = {
  fresh: 'text-fitness',
  neutral: 'text-muted-foreground',
  tired: 'text-fatigue',
  risk: 'text-fatigue',
}

function Delta({ value }: { value: number }) {
  if (Math.abs(value) < 0.5) return <span className="text-xs text-muted-foreground">— flat</span>
  const up = value > 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className="size-3" />
      {up ? '+' : ''}
      {round0(value)} vs 7d ago
    </span>
  )
}

export function StatusCards({ metrics }: { metrics: MetricsPoint[] }) {
  const idx = lastActualIndex(metrics)
  if (idx < 0) return null
  const today = metrics[idx]
  const weekAgo = idx >= 7 ? metrics[idx - 7] : null
  const zone = interpretForm(today.tsb)

  const cards = [
    {
      name: 'Fitness',
      code: 'CTL',
      icon: Activity,
      color: 'text-fitness',
      value: round0(today.ctl),
      delta: weekAgo ? today.ctl - weekAgo.ctl : null,
      sub: <span className="text-xs text-muted-foreground">long-term load</span>,
    },
    {
      name: 'Fatigue',
      code: 'ATL',
      icon: BatteryCharging,
      color: 'text-fatigue',
      value: round0(today.atl),
      delta: weekAgo ? today.atl - weekAgo.atl : null,
      sub: <span className="text-xs text-muted-foreground">recent load</span>,
    },
    {
      name: 'Form',
      code: 'TSB',
      icon: Gauge,
      color: 'text-form',
      value: round0(today.tsb),
      delta: null,
      sub: <span className={cn('text-xs font-medium', TONE_CLASS[zone.tone])}>{zone.label}</span>,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.code} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <c.icon className={cn('size-5', c.color)} />
            <span className="font-semibold">{c.name}</span>
            <span className="text-xs text-muted-foreground">{c.code}</span>
          </div>
          <div className="mt-2 text-4xl font-bold tabular-nums">{c.value}</div>
          <div className="mt-1">{c.delta != null ? <Delta value={c.delta} /> : c.sub}</div>
          {c.delta != null && <div className="mt-0.5">{c.sub}</div>}
        </div>
      ))}
      <p className="sm:col-span-3 -mt-1 text-sm text-muted-foreground">
        {zone.description} As of {today.date}.
      </p>
    </div>
  )
}
