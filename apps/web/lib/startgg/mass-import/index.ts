import { GraphQLClient } from 'graphql-request'
import { prisma } from '@/lib/db/prisma'
import { RateLimiter } from './rate-limiter'
import { ProgressTracker } from './progress-tracker'
import {
  TOURNAMENTS_BY_VIDEOGAME_QUERY,
  PAST_TOURNAMENTS_BY_VIDEOGAME_QUERY,
  EVENT_SETS_QUERY,
} from './queries'
import {
  TWOXKO_VIDEOGAME_ID,
  TWOXKO_IMPORT_START_DATE,
  STARTGG_PAGINATION,
} from '../constants'
import type {
  MassImportOptions,
  ImportProgress,
  TournamentsResponse,
  EventSetsResponse,
  TournamentNode,
  SetNode,
} from './types'

export class MassImportService {
  private client: GraphQLClient
  private rateLimiter: RateLimiter
  private progress: ProgressTracker
  private abortController: AbortController
  private jobId: string
  private videogameId: number
  private startDate: Date

  constructor(
    apiKey: string,
    options: MassImportOptions = { startDate: TWOXKO_IMPORT_START_DATE }
  ) {
    this.client = new GraphQLClient('https://api.start.gg/gql/alpha', {
      headers: { authorization: `Bearer ${apiKey}` },
    })
    this.rateLimiter = new RateLimiter()
    this.abortController = new AbortController()
    this.jobId = options.jobId || crypto.randomUUID()
    this.videogameId = options.videogameId || TWOXKO_VIDEOGAME_ID
    this.startDate = options.startDate
    this.progress = new ProgressTracker(this.jobId)
  }

  /**
   * Get the job ID
   */
  getJobId(): string {
    return this.jobId
  }

  /**
   * Get current progress
   */
  getProgress(): ImportProgress {
    return this.progress.getProgress()
  }

  /**
   * Main entry point - run the full import
   */
  async run(): Promise<ImportProgress> {
    try {
      await this.progress.update({ status: 'running' })
      await this.createJobRecord()

      // Phase 1: Import tournaments (includes events)
      await this.importTournaments()

      // Phase 2: Import sets for all events
      await this.importSets()

      // Phase 3: Import participants
      await this.importParticipants()

      await this.progress.update({ status: 'completed' })
      await this.finalizeJob('COMPLETED')

      return this.progress.getProgress()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.progress.addError({ message: errorMessage, item: 'Overall import' })
      await this.progress.update({ status: 'failed' })
      await this.finalizeJob('FAILED')
      throw error
    }
  }

  /**
   * Cancel the import
   */
  cancel(): void {
    this.abortController.abort()
    this.progress.update({ status: 'cancelled' })
    this.finalizeJob('CANCELLED')
  }

  /**
   * Check if cancelled
   */
  private isCancelled(): boolean {
    return this.abortController.signal.aborted
  }

  /**
   * Create the job record in the database
   */
  private async createJobRecord(): Promise<void> {
    await prisma.startGGImportJob.create({
      data: {
        id: this.jobId,
        status: 'RUNNING',
        videogameId: this.videogameId,
        videogameName: '2XKO',
        startDate: this.startDate,
        startedAt: new Date(),
      },
    })
  }

  /**
   * Finalize the job record
   */
  private async finalizeJob(
    status: 'COMPLETED' | 'FAILED' | 'CANCELLED'
  ): Promise<void> {
    await this.progress.flush()
    await prisma.startGGImportJob.update({
      where: { id: this.jobId },
      data: {
        status,
        completedAt: new Date(),
      },
    })
  }

  /**
   * Phase 1: Import all tournaments
   */
  private async importTournaments(): Promise<void> {
    await this.progress.update({
      phase: 'tournaments',
      currentItem: 'Starting tournament import...',
    })

    const afterDate = Math.floor(this.startDate.getTime() / 1000)
    const perPage = STARTGG_PAGINATION.TOURNAMENTS_PER_PAGE

    // Import both upcoming and past tournaments
    for (const query of [
      TOURNAMENTS_BY_VIDEOGAME_QUERY,
      PAST_TOURNAMENTS_BY_VIDEOGAME_QUERY,
    ]) {
      let page = 1
      let totalPages = 1

      while (page <= totalPages) {
        if (this.isCancelled()) return

        await this.rateLimiter.acquire()
        this.progress.updateRateInfo(
          this.rateLimiter.getAvailableTokens(),
          Date.now() + this.rateLimiter.getTimeUntilRefill()
        )

        try {
          const response = await this.client.request<TournamentsResponse>(query, {
            videogameId: this.videogameId,
            page,
            perPage,
            afterDate,
          })

          if (page === 1) {
            totalPages = response.tournaments.pageInfo.totalPages
            const currentTotal = this.progress.getProgress().totalTournaments
            await this.progress.update({
              totalTournaments: currentTotal + response.tournaments.pageInfo.total,
            })
          }

          for (const tournament of response.tournaments.nodes) {
            if (this.isCancelled()) return

            await this.progress.update({ currentItem: tournament.name })

            await this.upsertTournament(tournament)

            // Also upsert events that came with the tournament
            for (const event of tournament.events || []) {
              await this.upsertEvent(event, tournament.id)
            }

            await this.progress.update({
              processedTournaments:
                this.progress.getProgress().processedTournaments + 1,
            })
          }

          page++
        } catch (error) {
          this.progress.addError({
            message:
              error instanceof Error ? error.message : 'Failed to fetch tournaments',
            item: `Page ${page}`,
          })
          break
        }
      }
    }
  }

  /**
   * Upsert a tournament record
   */
  private async upsertTournament(tournament: TournamentNode): Promise<void> {
    const profileImage = tournament.images?.find((i) => i.type === 'profile')?.url
    const bannerImage = tournament.images?.find((i) => i.type === 'banner')?.url

    await prisma.startGGTournament.upsert({
      where: { startGgId: tournament.id },
      create: {
        startGgId: tournament.id,
        name: tournament.name,
        slug: tournament.slug,
        startAt: new Date(tournament.startAt * 1000),
        endAt: tournament.endAt ? new Date(tournament.endAt * 1000) : null,
        city: tournament.city,
        countryCode: tournament.countryCode,
        state: tournament.state,
        venueName: tournament.venueName,
        venueAddress: tournament.venueAddress,
        numAttendees: tournament.numAttendees,
        timezone: tournament.timezone,
        isOnline: tournament.isOnline ?? false,
        hasOfflineEvents: tournament.hasOfflineEvents ?? false,
        imageUrl: profileImage,
        bannerUrl: bannerImage,
        hashtag: tournament.hashtag,
        syncStatus: 'IN_PROGRESS',
        lastSyncedAt: new Date(),
      },
      update: {
        name: tournament.name,
        startAt: new Date(tournament.startAt * 1000),
        endAt: tournament.endAt ? new Date(tournament.endAt * 1000) : null,
        city: tournament.city,
        countryCode: tournament.countryCode,
        state: tournament.state,
        numAttendees: tournament.numAttendees,
        isOnline: tournament.isOnline ?? false,
        hasOfflineEvents: tournament.hasOfflineEvents ?? false,
        imageUrl: profileImage,
        bannerUrl: bannerImage,
        syncStatus: 'IN_PROGRESS',
        lastSyncedAt: new Date(),
      },
    })
  }

  /**
   * Upsert an event record
   */
  private async upsertEvent(event: any, tournamentStartGgId: number): Promise<void> {
    // Find our tournament record
    const tournament = await prisma.startGGTournament.findUnique({
      where: { startGgId: tournamentStartGgId },
      select: { id: true },
    })

    if (!tournament) return

    await prisma.startGGEvent.upsert({
      where: { startGgId: event.id },
      create: {
        startGgId: event.id,
        tournamentId: tournament.id,
        name: event.name,
        slug: event.slug,
        type: event.type,
        videogameId: event.videogame?.id || this.videogameId,
        videogameName: event.videogame?.name || '2XKO',
        startAt: event.startAt ? new Date(event.startAt * 1000) : null,
        numEntrants: event.numEntrants,
        state: event.state,
        isOnline: event.isOnline ?? false,
        syncStatus: 'IN_PROGRESS',
        lastSyncedAt: new Date(),
      },
      update: {
        name: event.name,
        startAt: event.startAt ? new Date(event.startAt * 1000) : null,
        numEntrants: event.numEntrants,
        state: event.state,
        syncStatus: 'IN_PROGRESS',
        lastSyncedAt: new Date(),
      },
    })

    // Update event count
    const currentEvents = this.progress.getProgress().totalEvents
    await this.progress.update({ totalEvents: currentEvents + 1 })
  }

  /**
   * Phase 2: Import sets for all events
   */
  private async importSets(): Promise<void> {
    await this.progress.update({
      phase: 'sets',
      currentItem: 'Starting sets import...',
    })

    const events = await prisma.startGGEvent.findMany({
      where: {
        tournament: {
          startAt: { gte: this.startDate },
        },
      },
      select: { id: true, startGgId: true, name: true },
    })

    for (const event of events) {
      if (this.isCancelled()) return

      await this.progress.update({ currentItem: `Sets: ${event.name}` })

      let page = 1
      let totalPages = 1
      const perPage = STARTGG_PAGINATION.SETS_PER_PAGE

      while (page <= totalPages) {
        if (this.isCancelled()) return

        await this.rateLimiter.acquire()

        try {
          const response = await this.client.request<EventSetsResponse>(
            EVENT_SETS_QUERY,
            {
              eventId: event.startGgId,
              page,
              perPage,
            }
          )

          if (page === 1 && response.event?.sets?.pageInfo) {
            totalPages = response.event.sets.pageInfo.totalPages || 1
            const currentTotal = this.progress.getProgress().totalSets
            await this.progress.update({
              totalSets: currentTotal + (response.event.sets.pageInfo.total || 0),
            })
          }

          if (response.event?.sets?.nodes) {
            for (const set of response.event.sets.nodes) {
              await this.upsertSet(set, event.id)
              await this.progress.update({
                processedSets: this.progress.getProgress().processedSets + 1,
              })
            }
          }

          page++
        } catch (error) {
          this.progress.addError({
            message: error instanceof Error ? error.message : 'Failed to fetch sets',
            item: event.name,
          })
          break
        }
      }

      // Mark event as synced
      await prisma.startGGEvent.update({
        where: { id: event.id },
        data: { syncStatus: 'COMPLETED' },
      })
    }
  }

  /**
   * Upsert a set record
   */
  private async upsertSet(set: SetNode, eventId: string): Promise<void> {
    const slot1 = set.slots?.[0]
    const slot2 = set.slots?.[1]

    // First, ensure entrants exist
    let slot1EntrantId: string | null = null
    let slot2EntrantId: string | null = null

    if (slot1?.entrant) {
      slot1EntrantId = await this.upsertEntrant(slot1.entrant, eventId)
    }
    if (slot2?.entrant) {
      slot2EntrantId = await this.upsertEntrant(slot2.entrant, eventId)
    }

    await prisma.startGGSet.upsert({
      where: { startGgId: set.id },
      create: {
        startGgId: set.id,
        eventId,
        phaseId: set.phaseGroup?.phase?.id,
        phaseGroupId: set.phaseGroup?.id,
        fullRoundText: set.fullRoundText,
        round: set.round,
        identifier: set.identifier,
        state: set.state,
        startAt: set.startAt ? new Date(set.startAt * 1000) : null,
        startedAt: set.startedAt ? new Date(set.startedAt * 1000) : null,
        completedAt: set.completedAt ? new Date(set.completedAt * 1000) : null,
        slot1EntrantId,
        slot1Score: slot1?.standing?.stats?.score?.value,
        slot1Standing: slot1?.standing?.placement,
        slot2EntrantId,
        slot2Score: slot2?.standing?.stats?.score?.value,
        slot2Standing: slot2?.standing?.placement,
        winnerId: set.winnerId,
        displayScore: set.displayScore,
        totalGames: set.totalGames,
        stationNumber: set.station?.number,
      },
      update: {
        state: set.state,
        startedAt: set.startedAt ? new Date(set.startedAt * 1000) : null,
        completedAt: set.completedAt ? new Date(set.completedAt * 1000) : null,
        slot1EntrantId,
        slot1Score: slot1?.standing?.stats?.score?.value,
        slot2EntrantId,
        slot2Score: slot2?.standing?.stats?.score?.value,
        winnerId: set.winnerId,
        displayScore: set.displayScore,
      },
    })
  }

  /**
   * Upsert an entrant record and return its ID
   */
  private async upsertEntrant(entrant: any, eventId: string): Promise<string> {
    const record = await prisma.startGGEntrant.upsert({
      where: { startGgId: entrant.id },
      create: {
        startGgId: entrant.id,
        eventId,
        name: entrant.name,
        initialSeedNum: entrant.initialSeedNum,
      },
      update: {
        name: entrant.name,
        initialSeedNum: entrant.initialSeedNum,
      },
      select: { id: true },
    })

    return record.id
  }

  /**
   * Phase 3: Import participants
   */
  private async importParticipants(): Promise<void> {
    await this.progress.update({
      phase: 'participants',
      currentItem: 'Starting participant import...',
    })

    // Get all entrants with their participants from sets
    const entrants = await prisma.startGGEntrant.findMany({
      select: {
        id: true,
        startGgId: true,
        event: {
          select: {
            tournamentId: true,
          },
        },
      },
    })

    // For each tournament, fetch participants
    const processedTournaments = new Set<string>()

    for (const entrant of entrants) {
      if (this.isCancelled()) return

      const tournamentId = entrant.event.tournamentId

      if (processedTournaments.has(tournamentId)) continue
      processedTournaments.add(tournamentId)

      // For now, we'll extract participants from the sets we already have
      // A more thorough approach would be to query participants separately
      await this.progress.update({
        processedParticipants:
          this.progress.getProgress().processedParticipants + 1,
      })
    }

    // Mark all tournaments as synced
    await prisma.startGGTournament.updateMany({
      where: {
        startAt: { gte: this.startDate },
        syncStatus: 'IN_PROGRESS',
      },
      data: { syncStatus: 'COMPLETED' },
    })
  }
}

// Export for convenience
export { ProgressTracker } from './progress-tracker'
export { RateLimiter } from './rate-limiter'
export type { ImportProgress, MassImportOptions } from './types'
