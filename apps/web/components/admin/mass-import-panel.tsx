'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'

interface ImportProgress {
  jobId: string
  status: string
  phase: string
  currentItem: string
  totalTournaments: number
  processedTournaments: number
  totalEvents: number
  processedEvents: number
  totalSets: number
  processedSets: number
  totalParticipants: number
  processedParticipants: number
  errorCount: number
  recentErrors: Array<{ message: string; item: string; timestamp: number }>
}

export function MassImportPanel() {
  const [isRunning, setIsRunning] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const connectToProgress = useCallback((id: string) => {
    const eventSource = new EventSource(`/api/startgg/mass-import?jobId=${id}`)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'initial') {
          setProgress({
            jobId: data.data.id,
            status: data.data.status.toLowerCase(),
            phase: 'tournaments',
            currentItem: '',
            totalTournaments: data.data.totalTournaments,
            processedTournaments: data.data.processedTournaments,
            totalEvents: data.data.totalEvents,
            processedEvents: data.data.processedEvents,
            totalSets: data.data.totalSets,
            processedSets: data.data.processedSets,
            totalParticipants: data.data.totalParticipants,
            processedParticipants: data.data.processedParticipants,
            errorCount: data.data.errorCount,
            recentErrors: data.data.errors || [],
          })
        } else if (data.type === 'import:progress') {
          setProgress(data.data)

          if (data.data.status === 'completed') {
            setIsRunning(false)
            eventSource.close()
          } else if (
            data.data.status === 'failed' ||
            data.data.status === 'cancelled'
          ) {
            setIsRunning(false)
            eventSource.close()
          }
        }
      } catch (e) {
        console.error('Failed to parse SSE message:', e)
      }
    }

    eventSource.onerror = () => {
      setError('Lost connection to import progress')
      setIsRunning(false)
      eventSource.close()
    }

    eventSourceRef.current = eventSource
  }, [])

  const startImport = async () => {
    try {
      setError(null)
      const response = await fetch('/api/startgg/mass-import', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start import')
      }

      const data = await response.json()
      setJobId(data.jobId)
      setIsRunning(true)
      connectToProgress(data.jobId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start import')
    }
  }

  const cancelImport = async () => {
    if (!jobId) return

    try {
      await fetch(`/api/startgg/mass-import/${jobId}`, { method: 'DELETE' })
      eventSourceRef.current?.close()
      setIsRunning(false)
    } catch (err) {
      setError('Failed to cancel import')
    }
  }

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close()
    }
  }, [])

  const getPhaseProgress = () => {
    if (!progress) return { percent: 0, processed: 0, total: 0 }

    const phaseMap: Record<string, { total: number; processed: number }> = {
      tournaments: {
        total: progress.totalTournaments,
        processed: progress.processedTournaments,
      },
      events: {
        total: progress.totalEvents,
        processed: progress.processedEvents,
      },
      sets: {
        total: progress.totalSets,
        processed: progress.processedSets,
      },
      participants: {
        total: progress.totalParticipants,
        processed: progress.processedParticipants,
      },
    }

    const current = phaseMap[progress.phase] || { total: 0, processed: 0 }
    const percent =
      current.total > 0 ? Math.round((current.processed / current.total) * 100) : 0

    return { percent, ...current }
  }

  const phaseProgress = getPhaseProgress()

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl shadow-black/20">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">2XKO Mass Import</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Import all 2XKO tournaments from start.gg (January 2026 onwards)
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {!isRunning && !progress ? (
        <Button
          onClick={startImport}
          className="bg-purple-600 text-white hover:bg-purple-700"
        >
          Start Mass Import
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">
                Phase:{' '}
                <span className="font-medium text-white">
                  {progress?.phase?.toUpperCase()}
                </span>
              </span>
              <span className="text-zinc-400">{phaseProgress.percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full bg-purple-500 transition-all duration-300 ease-out"
                style={{ width: `${phaseProgress.percent}%` }}
              />
            </div>
          </div>

          <div className="text-sm">
            <span className="text-zinc-500">Processing: </span>
            <span className="text-zinc-300">
              {progress?.currentItem || 'Initializing...'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-zinc-800/50 p-3">
              <div className="text-xs uppercase tracking-wider text-zinc-500">
                Tournaments
              </div>
              <div className="text-lg font-semibold text-white">
                {progress?.processedTournaments || 0}
                <span className="font-normal text-zinc-500">
                  {' / '}
                  {progress?.totalTournaments || 0}
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-3">
              <div className="text-xs uppercase tracking-wider text-zinc-500">
                Events
              </div>
              <div className="text-lg font-semibold text-white">
                {progress?.processedEvents || 0}
                <span className="font-normal text-zinc-500">
                  {' / '}
                  {progress?.totalEvents || 0}
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-3">
              <div className="text-xs uppercase tracking-wider text-zinc-500">
                Sets
              </div>
              <div className="text-lg font-semibold text-white">
                {progress?.processedSets || 0}
                <span className="font-normal text-zinc-500">
                  {' / '}
                  {progress?.totalSets || 0}
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-3">
              <div className="text-xs uppercase tracking-wider text-zinc-500">
                Errors
              </div>
              <div
                className={`text-lg font-semibold ${
                  (progress?.errorCount || 0) > 0 ? 'text-red-400' : 'text-white'
                }`}
              >
                {progress?.errorCount || 0}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex h-2 w-2 rounded-full ${
                  progress?.status === 'running'
                    ? 'animate-pulse bg-green-500'
                    : progress?.status === 'completed'
                    ? 'bg-blue-500'
                    : progress?.status === 'failed'
                    ? 'bg-red-500'
                    : 'bg-zinc-500'
                }`}
              />
              <span className="text-sm capitalize text-zinc-400">
                {progress?.status || 'pending'}
              </span>
            </div>

            {isRunning && (
              <Button onClick={cancelImport} variant="destructive" size="sm">
                Cancel
              </Button>
            )}
          </div>

          {(progress?.recentErrors?.length || 0) > 0 && (
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <h3 className="mb-2 text-sm font-medium text-red-400">
                Recent Errors
              </h3>
              <div className="max-h-24 space-y-1 overflow-y-auto">
                {progress?.recentErrors.slice(0, 5).map((err, i) => (
                  <div key={i} className="text-xs text-zinc-400">
                    <span className="text-zinc-500">{err.item}:</span> {err.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
