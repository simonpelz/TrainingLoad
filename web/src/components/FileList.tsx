import { X } from 'lucide-react'
import { activityStats, type Activity } from '@/core'

export interface LoadedFile {
  id: string
  name: string
  activities: Activity[]
}

interface FileListProps {
  files: LoadedFile[]
  combinedDays: number
  onRemove: (id: string) => void
  onClear: () => void
}

export function FileList({ files, combinedDays, onRemove, onClear }: FileListProps) {
  if (files.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card p-3 text-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium">
          {files.length === 1 ? '1 file' : `${files.length} files`} stitched together,{' '}
          {combinedDays.toLocaleString()} days
        </span>
        {files.length > 1 && (
          <button
            onClick={onClear}
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Clear all
          </button>
        )}
      </div>
      <ul className="divide-y divide-border">
        {files.map((f) => {
          const s = activityStats(f.activities)
          return (
            <li key={f.id} className="flex items-center justify-between gap-3 py-1.5">
              <div className="min-w-0">
                <span className="block truncate font-mono text-xs">{f.name}</span>
                <span className="text-xs text-muted-foreground">
                  {s.days} days
                  {s.start && s.end ? `, ${s.start} to ${s.end}` : ''}
                </span>
              </div>
              <button
                onClick={() => onRemove(f.id)}
                title="Remove this file"
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
