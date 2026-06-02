import { useCallback, useRef, useState } from 'react'
import { FileUp, Sparkles, Upload } from 'lucide-react'
import { parseCsv, toActivities, type Activity, type ParsedCsv } from '@/core'
import { cn } from '@/lib/utils'

interface FileDropProps {
  onLoad: (activities: Activity[], sourceName: string) => void
  onLoadSample: () => void
  /** Compact variant for the in-dashboard "load another file" button. */
  compact?: boolean
}

export function FileDrop({ onLoad, onLoadSample, compact = false }: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // When auto-detection fails we ask the user to map the columns.
  const [pending, setPending] = useState<{ parsed: ParsedCsv; name: string } | null>(null)
  const [dateCol, setDateCol] = useState('')
  const [tssCol, setTssCol] = useState('')

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      setError(null)
      if (!files || files.length === 0) return
      try {
        const texts = await Promise.all(Array.from(files).map((f) => f.text()))
        // Parse each file; use the first to detect columns.
        const parsedAll = texts.map((t) => parseCsv(t))
        const first = parsedAll[0]
        const name =
          files.length === 1 ? files[0].name : `${files.length} files`

        if (first.dateColumn && first.tssColumn) {
          const acts = parsedAll.flatMap((p) =>
            toActivities(p, first.dateColumn!, first.tssColumn!),
          )
          if (acts.length === 0) {
            setError('No rows with a valid date were found in that file.')
            return
          }
          onLoad(acts, name)
        } else {
          // Need manual mapping (fall back to the first file's columns).
          setPending({ parsed: first, name })
          setDateCol(first.dateColumn ?? first.columns[0] ?? '')
          setTssCol(first.tssColumn ?? first.columns[1] ?? '')
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not read that file.')
      }
    },
    [onLoad],
  )

  const confirmMapping = () => {
    if (!pending) return
    const acts = toActivities(pending.parsed, dateCol, tssCol)
    if (acts.length === 0) {
      setError('No rows with a valid date in the selected date column.')
      return
    }
    onLoad(acts, pending.name)
    setPending(null)
  }

  // ----- Column-mapping prompt -----
  if (pending) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="font-medium">Which columns should we use?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We couldn&apos;t auto-detect them in <span className="font-mono">{pending.name}</span>.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-muted-foreground">Date column</span>
            <select
              value={dateCol}
              onChange={(e) => setDateCol(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5"
            >
              {pending.parsed.columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-muted-foreground">TSS column</span>
            <select
              value={tssCol}
              onChange={(e) => setTssCol(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5"
            >
              {pending.parsed.columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-fatigue">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button
            onClick={confirmMapping}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Load
          </button>
          <button
            onClick={() => setPending(null)}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // ----- Compact button (used inside the dashboard) -----
  if (compact) {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
        >
          <FileUp className="size-4" />
          Load CSV
        </button>
      </>
    )
  }

  // ----- Full drop zone (empty state) -----
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors',
          dragging ? 'border-form bg-form/5' : 'border-border bg-card/50 hover:border-form/50',
        )}
      >
        <Upload className="size-8 text-muted-foreground" />
        <p className="mt-4 font-medium">Drag &amp; drop your activity CSV here</p>
        <p className="mt-1 text-sm text-muted-foreground">
          ...or click to browse. TrainingPeaks, Strava and Garmin exports all work.
        </p>
      </div>
      {error && <p className="mt-3 text-center text-sm text-fatigue">{error}</p>}
      <div className="mt-4 text-center">
        <button
          onClick={onLoadSample}
          className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <Sparkles className="size-4 text-form" />
          Try with sample data
        </button>
      </div>
    </div>
  )
}
