import { prisma } from '@/lib/db/prisma'
import { getEventBus } from '@/lib/realtime/event-bus'
import type { Prisma } from '@repo/database'
import type { ImportProgress, ImportError } from './types'

type ImportJobStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

const STATUS_MAP: Record<ImportProgress['status'], ImportJobStatus> = {
  pending: 'PENDING',
  running: 'RUNNING',
  completed: 'COMPLETED',
  failed: 'FAILED',
  cancelled: 'CANCELLED',
}

export class ProgressTracker {
  private progress: ImportProgress
  private eventBus = getEventBus()
  private persistDebounce: NodeJS.Timeout | null = null

  constructor(jobId: string) {
    this.progress = {
      jobId,
      status: 'pending',
      phase: 'tournaments',
      currentItem: '',
      totalTournaments: 0,
      processedTournaments: 0,
      totalEvents: 0,
      processedEvents: 0,
      totalSets: 0,
      processedSets: 0,
      totalParticipants: 0,
      processedParticipants: 0,
      errorCount: 0,
      recentErrors: [],
      startedAt: Date.now(),
      rateInfo: {
        requestsRemaining: 80,
        windowResetAt: Date.now() + 60000,
      },
    }
  }

  /**
   * Update progress and broadcast to SSE clients
   */
  async update(partial: Partial<ImportProgress>): Promise<void> {
    Object.assign(this.progress, partial)

    await this.eventBus.publish(
      `import:${this.progress.jobId}`,
      'import:progress',
      this.progress
    )

    this.schedulePersist()
  }

  /**
   * Debounced database persistence
   */
  private schedulePersist(): void {
    if (this.persistDebounce) {
      clearTimeout(this.persistDebounce)
    }
    this.persistDebounce = setTimeout(() => this.persistToDatabase(), 2000)
  }

  /**
   * Persist current progress to database
   */
  async persistToDatabase(): Promise<void> {
    try {
      await prisma.startGGImportJob.update({
        where: { id: this.progress.jobId },
        data: {
          status: STATUS_MAP[this.progress.status],
          totalTournaments: this.progress.totalTournaments,
          processedTournaments: this.progress.processedTournaments,
          totalEvents: this.progress.totalEvents,
          processedEvents: this.progress.processedEvents,
          totalSets: this.progress.totalSets,
          processedSets: this.progress.processedSets,
          totalParticipants: this.progress.totalParticipants,
          processedParticipants: this.progress.processedParticipants,
          errorCount: this.progress.errorCount,
          errors: this.progress.recentErrors as Prisma.InputJsonValue,
          lastActivityAt: new Date(),
        },
      })
    } catch (error) {
      console.error('[ProgressTracker] Failed to persist:', error)
    }
  }

  /**
   * Force immediate persist (for final state)
   */
  async flush(): Promise<void> {
    if (this.persistDebounce) {
      clearTimeout(this.persistDebounce)
    }
    await this.persistToDatabase()
  }

  /**
   * Get current progress
   */
  getProgress(): ImportProgress {
    return { ...this.progress }
  }

  /**
   * Add an error to the error log
   */
  addError(error: Omit<ImportError, 'timestamp'>): void {
    this.progress.errorCount++
    this.progress.recentErrors.unshift({
      ...error,
      timestamp: Date.now(),
    })
    this.progress.recentErrors = this.progress.recentErrors.slice(0, 50)
  }

  /**
   * Update rate limit info
   */
  updateRateInfo(requestsRemaining: number, windowResetAt: number): void {
    this.progress.rateInfo = { requestsRemaining, windowResetAt }
  }
}
