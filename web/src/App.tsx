import { Activity, BatteryCharging, Gauge, ShieldCheck, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

const METRICS = [
  {
    key: 'fitness',
    name: 'Fitness',
    code: 'CTL',
    icon: Activity,
    blurb: 'Your long-term training base — a slow average of daily load.',
    color: 'text-fitness',
    ring: 'ring-fitness/30',
  },
  {
    key: 'fatigue',
    name: 'Fatigue',
    code: 'ATL',
    icon: BatteryCharging,
    blurb: 'Your short-term tiredness — a fast average of recent load.',
    color: 'text-fatigue',
    ring: 'ring-fatigue/30',
  },
  {
    key: 'form',
    name: 'Form',
    code: 'TSB',
    icon: Gauge,
    blurb: 'Fitness minus fatigue. Positive = fresh, negative = fatigued.',
    color: 'text-form',
    ring: 'ring-form/30',
  },
] as const

function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Gauge className="size-6 text-form" />
            <span className="text-lg font-semibold tracking-tight">Training Load</span>
          </div>
          <a
            href="https://github.com/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            GitHub
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <section className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            Your data never leaves your browser
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            See your fitness, fatigue &amp; form
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-lg text-muted-foreground">
            Drop in your TrainingPeaks, Strava or Garmin CSV export and watch your CTL, ATL and
            TSB curves — the same fitness &amp; freshness chart you pay a subscription for,
            free and private.
          </p>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-3">
          {METRICS.map((m) => (
            <div
              key={m.key}
              className={cn(
                'rounded-lg border border-border bg-card p-5 ring-1 ring-inset',
                m.ring,
              )}
            >
              <div className="flex items-center gap-2">
                <m.icon className={cn('size-5', m.color)} />
                <span className="font-semibold">{m.name}</span>
                <span className="text-xs text-muted-foreground">{m.code}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{m.blurb}</p>
            </div>
          ))}
        </section>

        <section className="mt-12">
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/50 px-6 py-16 text-center">
            <Upload className="size-8 text-muted-foreground" />
            <p className="mt-4 font-medium">Drag &amp; drop your activity CSV here</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Coming in the next build — the upload &amp; chart UI (WP2).
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-6 text-center text-sm text-muted-foreground">
          Runs entirely in your browser · no upload, no account · MIT licensed
        </div>
      </footer>
    </div>
  )
}

export default App
