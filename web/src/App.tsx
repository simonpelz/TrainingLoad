import { useCallback, useMemo, useRef, useState } from 'react'
import { Gauge, Github, ImageDown, Moon, ShieldCheck, Sun, Table2 } from 'lucide-react'
import {
  aggregateDaily,
  computeMetrics,
  generateSampleActivities,
  DEFAULT_TAU_CTL,
  DEFAULT_TAU_ATL,
  type Activity,
} from '@/core'
import { FileDrop } from '@/components/FileDrop'
import { StatusCards } from '@/components/StatusCards'
import { Controls, type SeriesVisibility, type TimeframePreset } from '@/components/Controls'
import { LoadChart } from '@/components/LoadChart'
import { downloadText, metricsToCsv } from '@/lib/exportCsv'

const DEFAULT_FORECAST = 30

type ChartInstance = { getDataURL: (opts?: Record<string, unknown>) => string }

function App() {
  const [activities, setActivities] = useState<Activity[] | null>(null)
  const [sourceName, setSourceName] = useState('')
  const [tauCtl, setTauCtl] = useState(DEFAULT_TAU_CTL)
  const [tauAtl, setTauAtl] = useState(DEFAULT_TAU_ATL)
  const [futureDays, setFutureDays] = useState(DEFAULT_FORECAST)
  const [visible, setVisible] = useState<SeriesVisibility>({
    tss: true,
    ctl: true,
    atl: true,
    tsb: true,
  })
  const [timeframe, setTimeframe] = useState<TimeframePreset>('365')
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  const chartRef = useRef<ChartInstance | null>(null)

  const metrics = useMemo(
    () =>
      activities
        ? computeMetrics(aggregateDaily(activities), { tauCtl, tauAtl, futureDays })
        : [],
    [activities, tauCtl, tauAtl, futureDays],
  )

  const handleLoad = useCallback((acts: Activity[], name: string) => {
    setActivities(acts)
    setSourceName(name)
  }, [])

  const handleSample = useCallback(() => {
    setActivities(generateSampleActivities())
    setSourceName('Sample data')
  }, [])

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
  }

  const resetParams = () => {
    setTauCtl(DEFAULT_TAU_CTL)
    setTauAtl(DEFAULT_TAU_ATL)
    setFutureDays(DEFAULT_FORECAST)
  }

  const exportPng = () => {
    const url = chartRef.current?.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: dark ? '#0b1220' : '#ffffff',
    })
    if (url) {
      const a = document.createElement('a')
      a.href = url
      a.download = 'training-load.png'
      a.click()
    }
  }

  const exportCsv = () => downloadText('training-load.csv', metricsToCsv(metrics))

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <Gauge className="size-6 text-form" />
            <span className="text-lg font-semibold tracking-tight">Training Load</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              title="Toggle theme"
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <a
              href="https://github.com/YOUR-USERNAME/TrainingLoad"
              target="_blank"
              rel="noreferrer"
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="GitHub"
            >
              <Github className="size-4" />
            </a>
          </div>
        </div>
      </header>

      {!activities ? (
        // ---------- Empty state ----------
        <main className="mx-auto max-w-3xl px-6 py-16">
          <section className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              Your data never leaves your browser
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
              See your fitness, fatigue &amp; form
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-balance text-lg text-muted-foreground">
              Drop in a TrainingPeaks, Strava or Garmin CSV export and watch your CTL, ATL and
              TSB curves — the fitness &amp; freshness chart you pay a subscription for, free and
              private.
            </p>
          </section>
          <section className="mt-10">
            <FileDrop onLoad={handleLoad} onLoadSample={handleSample} />
          </section>
        </main>
      ) : (
        // ---------- Dashboard ----------
        <main className="mx-auto max-w-6xl space-y-5 px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Source: <span className="font-medium text-foreground">{sourceName}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={exportCsv}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-muted"
              >
                <Table2 className="size-4" /> CSV
              </button>
              <button
                onClick={exportPng}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-muted"
              >
                <ImageDown className="size-4" /> PNG
              </button>
              <FileDrop onLoad={handleLoad} onLoadSample={handleSample} compact />
            </div>
          </div>

          <StatusCards metrics={metrics} />

          <Controls
            tauCtl={tauCtl}
            tauAtl={tauAtl}
            futureDays={futureDays}
            onTau={(which, v) => (which === 'ctl' ? setTauCtl(v) : setTauAtl(v))}
            onFutureDays={setFutureDays}
            visible={visible}
            onToggle={(key) => setVisible((s) => ({ ...s, [key]: !s[key] }))}
            timeframe={timeframe}
            onTimeframe={setTimeframe}
            onReset={resetParams}
          />

          <div className="rounded-xl border border-border bg-card p-2">
            <LoadChart
              metrics={metrics}
              visible={visible}
              dark={dark}
              timeframe={timeframe}
              onReady={(inst) => (chartRef.current = inst as ChartInstance)}
            />
          </div>
        </main>
      )}

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-sm text-muted-foreground">
          Runs entirely in your browser · no upload, no account · MIT licensed
        </div>
      </footer>
    </div>
  )
}

export default App
