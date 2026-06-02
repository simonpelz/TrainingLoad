import { useCallback, useRef, useState } from 'react'
import { FilePlus2, Sparkles, Upload } from 'lucide-react'
import { parseCsv, toActivities, type Activity, type ParsedCsv } from '@/core'
import { cn } from '@/lib/utils'

export interface LoadedFileInput {
  name: string
  activities: Activity[]
}

interface FileDropProps {
  onAdd: (files: LoadedFileInput[]) => void
  onLoadSample: () => void
  /** Compact "add more files" button used inside the dashboard. */
  compact?: boolean
}

interface Pending {
  parsed: ParsedCsv[]
  names: string[]
}

export function FileDrop({ onAdd, onLoadSample, compact = false }: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // When auto-detection fails we ask the user to map the columns once and
  // apply that choice to every file in the batch (they share a format).
  const [pending, setPending] = useState<Pending | null>(null)
  const [dateCol, setDateCol] = useState('')
  const [tssCol, setTssCol] = useState('')

  const emit = useCallback(
    (parsedAll: ParsedCsv[], names: string[], dateColumn: string, tssColumn: string) => {
      const files: LoadedFileInput[] = []
      parsedAll.forEach((p, i) => {
        const activities = toActivities(p, dateColumn, tssColumn)
        if (activities.length > 0) files.push({ name: names[i], activities })
      })
      if (files.length === 0) {
        setError('No rows with a valid date were found in those files.')
        return
      }
      onAdd(files)
      setError(null)
    },
    [onAdd],
  )

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      setError(null)
      if (!fileList || fileList.length === 0) return
      const fileArr = Array.from(fileList)
      try {
        const parsedAll = await Promise.all(fileArr.map(async (f) => parseCsv(await f.text())))
        const names = fileArr.map((f) => f.name)
        const first = parsedAll[0]
        if (first.dateColumn && first.tssColumn) {
          emit(parsedAll, names, first.dateColumn, first.tssColumn)
        } else {
          setPending({ parsed: parsedAll, names })
          setDateCol(first.dateColumn ?? first.columns[0] ?? '')
          setTssCol(first.tssColumn ?? first.columns[1] ?? '')
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not read that file.')
      }
      if (inputRef.current) inputRef.current.value = '' // allow re-selecting the same file
    },
    [emit],
  )

  const confirmMapping = () => {
    if (!pending) return
    emit(pending.parsed, pending.names, dateCol, tssCol)
    setPending(null)
  }

  // ----- Column-mapping prompt -----
  if (pending) {
    const columns = pending.parsed[0]?.columns ?? []
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="font-medium">Which columns should we use?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We could not auto-detect them in{' '}
          <span className="font-mono">{pending.names.join(', ')}</span>.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-muted-foreground">Date column</span>
            <select
              value={dateCol}
              onChange={(e) => setDateCol(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5"
            >
              {columns.map((c) => (
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
              {columns.map((c) => (
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

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept=".csv,text/csv"
      multiple
      className="hidden"
      onChange={(e) => handleFiles(e.target.files)}
    />
  )

  // ----- Compact "add files" button (dashboard) -----
  if (compact) {
    return (
      <>
        {fileInput}
        <button
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
        >
          <FilePlus2 className="size-4" />
          Add CSV
        </button>
      </>
    )
  }

  // ----- Full drop zone (empty state) -----
  return (
    <div>
      {fileInput}
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
        <p className="mt-4 font-medium">Drag and drop your activity CSVs here</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Or click to browse. Drop several at once to stitch multiple years together. Works with
          TrainingPeaks, Strava and Garmin exports.
        </p>
      </div>
      {error && <p className="mt-3 text-center text-sm text-fatigue">{error}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
        <button
          onClick={onLoadSample}
          className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 font-medium hover:bg-muted"
        >
          <Sparkles className="size-4 text-form" />
          Try with sample data
        </button>
        <a
          href="https://github.com/simonpelz/TrainingLoad/blob/master/docs/EXPORTING.md"
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          How to export your data
        </a>
      </div>
    </div>
  )
}
