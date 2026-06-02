import { useCallback, useMemo, useRef, useState } from 'react'
import { Gauge, Github, ImageDown, Moon, ShieldCheck, Sun, Table2 } from 'lucide-react'
import {
  activityStats,
  aggregateDaily,
  computeMetrics,
  dedupeActivities,
  generateSampleActivities,
  DEFAULT_TAU_CTL,
  DEFAULT_TAU_ATL,
} from '@/core'
import { FileDrop, type LoadedFileInput } from '@/components/FileDrop'
import { FileList, type LoadedFile } from '@/components/FileList'
import { StatusCards } from '@/components/StatusCards'
import { Controls, type SeriesVisibility, type TimeframePreset } from '@/components/Controls'
import { LoadChart } from '@/components/LoadChart'
import { downloadText, metricsToCsv } from '@/lib/exportCsv'

const DEFAULT_FORECAST = 30

type ChartInstance = { getDataURL: (opts?: Record<string, unknown>) => string }

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

function App() {
  const [files, setFiles] = useState<LoadedFile[]>([])
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

  // Stitch every loaded file together, dropping exact-duplicate rows so
  // overlapping yearly exports are not double-counted.
  const combined = useMemo(
    () => dedupeActivities(files.flatMap((f) => f.activities)),
    [files],
  )
  const combinedDays = useMemo(() => activityStats(combined).days, [combined])

  const metrics = useMemo(
    () =>
      combined.length > 0
        ? computeMetrics(aggregateDaily(combined), { tauCtl, tauAtl, futureDays })
        : [],
    [combined, tauCtl, tauAtl, futureDays],
  )

  const handleAdd = useCallback((added: LoadedFileInput[]) => {
    setFiles((prev) => [...prev, ...added.map((f) => ({ ...f, id: newId() }))])
  }, [])

  const handleSample = useCallback(() => {
    setFiles([{ id: newId(), name: 'Sample data', activities: generateSampleActivities() }])
  }, [])

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id))
  const clearFiles = () => setFiles([])

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

  // Export the stitched, computed daily series (real days only). This CSV is
  // re-importable: WorkoutDay and TSS are auto-detected on the next upload.
  const exportCsv = () =>
    downloadText('training-load-combined.csv', metricsToCsv(metrics.filter((p) => !p.isForecast)))

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
              href="https://github.com/simonpelz/TrainingLoad"
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

      {files.length === 0 ? (
        // ---------- Empty state ----------
        <main className="mx-auto max-w-3xl px-6 py-16">
          <section className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              Your data never leaves your browser
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
              See your fitness, fatigue and form
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-balance text-lg text-muted-foreground">
              Drop in a TrainingPeaks, Strava or Garmin CSV export and watch your CTL, ATL and
              TSB curves. It is the fitness and freshness chart you pay a subscription for, free
              and private.
            </p>
          </section>
          <section className="mt-10">
            <FileDrop onAdd={handleAdd} onLoadSample={handleSample} />
          </section>
        </main>
      ) : (
        // ---------- Dashboard ----------
        <main className="mx-auto max-w-6xl space-y-5 px-6 py-6">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-muted"
            >
              <Table2 className="size-4" /> Combined CSV
            </button>
            <button
              onClick={exportPng}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-muted"
            >
              <ImageDown className="size-4" /> PNG
            </button>
            <FileDrop onAdd={handleAdd} onLoadSample={handleSample} compact />
          </div>

          <FileList
            files={files}
            combinedDays={combinedDays}
            onRemove={removeFile}
            onClear={clearFiles}
          />

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
          Runs entirely in your browser. No upload, no account. MIT licensed.
        </div>
      </footer>
    </div>
  )
}

export default App
