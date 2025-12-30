import { StartGGClient } from './client'
import { prisma } from '@/lib/db/prisma'
import { mapGameToEnum, isGameSupported } from './game-mapping'
import { MatchStatus } from '@repo/database'

export class MatchImporter {
  private client: StartGGClient

  constructor(apiKey: string) {
    this.client = new StartGGClient(apiKey)
  }

  /**
   * Import tournament and create matches
   */
  async importTournament(slug: string) {
    const tournamentData = await this.client.getTournament(slug)
    const tournament = tournamentData.tournament

    // Get primary game from first event (tournaments usually have one main game)
    const primaryGame = tournament.events[0]?.videogame.name
    if (!primaryGame || !isGameSupported(primaryGame)) {
      throw new Error(`Unsupported game: ${primaryGame}`)
    }

    const gameEnum = mapGameToEnum(primaryGame)

    // Check if tournament already exists
    const existingTournament = await prisma.tournament.findUnique({
      where: { startGgId: tournament.id.toString() },
    })

    let dbTournament
    if (existingTournament) {
      // Update existing tournament
      dbTournament = await prisma.tournament.update({
        where: { startGgId: tournament.id.toString() },
        data: {
          name: tournament.name,
          startDate: new Date(tournament.startAt * 1000),
          endDate: tournament.endAt ? new Date(tournament.endAt * 1000) : null,
          location: tournament.city || null,
        },
      })
    } else {
      // Create new tournament
      dbTournament = await prisma.tournament.create({
        data: {
          startGgId: tournament.id.toString(),
          name: tournament.name,
          slug: tournament.slug,
          game: gameEnum,
          startDate: new Date(tournament.startAt * 1000),
          endDate: tournament.endAt ? new Date(tournament.endAt * 1000) : null,
          location: tournament.city || null,
          imageUrl: tournament.images?.[0]?.url || null,
        },
      })
    }

    // Process each fighting game event
    let matchesImported = 0
    for (const event of tournament.events) {
      if (isGameSupported(event.videogame.name)) {
        const count = await this.importEvent(event.id, dbTournament.id, event.videogame.name)
        matchesImported += count
      }
    }

    return {
      tournament: dbTournament,
      matchesImported,
    }
  }

  /**
   * Import matches from an event
   */
  private async importEvent(
    eventId: number,
    tournamentId: string,
    gameName: string
  ): Promise<number> {
    const gameEnum = mapGameToEnum(gameName)

    // Get all sets (matches) from event
    const setsData = await this.client.getEventSets(eventId)
    const sets = setsData.event.sets.nodes

    let matchesImported = 0

    for (const set of sets) {
      try {
        // Skip if not a valid 1v1 match
        if (set.slots.length !== 2) continue
        if (!set.slots[0]?.entrant?.participants?.[0]) continue
        if (!set.slots[1]?.entrant?.participants?.[0]) continue

        const player1Data = set.slots[0].entrant.participants[0]
        const player2Data = set.slots[1].entrant.participants[0]

        // Create or find players
        const player1 = await this.findOrCreatePlayer(
          player1Data.gamerTag,
          player1Data.id.toString()
        )
        const player2 = await this.findOrCreatePlayer(
          player2Data.gamerTag,
          player2Data.id.toString()
        )

        // Determine match status
        let status: MatchStatus = 'SCHEDULED'
        if (set.completedAt) status = 'COMPLETED'
        else if (set.startedAt) status = 'LIVE'

        // Calculate scheduled start time (use startedAt or default to now)
        const scheduledStart = set.startedAt
          ? new Date(set.startedAt * 1000)
          : new Date()

        // Check if match already exists
        const existingMatch = await prisma.match.findUnique({
          where: { startGgId: set.id.toString() },
        })

        if (existingMatch) {
          // Update existing match
          await prisma.match.update({
            where: { startGgId: set.id.toString() },
            data: {
              status,
              actualStart: set.startedAt ? new Date(set.startedAt * 1000) : null,
              completedAt: set.completedAt ? new Date(set.completedAt * 1000) : null,
              player1Score: set.slots[0].standing?.stats?.score?.value || null,
              player2Score: set.slots[1].standing?.stats?.score?.value || null,
              winnerId: set.winnerId?.toString() || null,
            },
          })
        } else {
          // Create new match
          await prisma.match.create({
            data: {
              startGgId: set.id.toString(),
              tournamentId,
              game: gameEnum,
              player1Id: player1.id,
              player2Id: player2.id,
              status,
              scheduledStart,
              actualStart: set.startedAt ? new Date(set.startedAt * 1000) : null,
              completedAt: set.completedAt ? new Date(set.completedAt * 1000) : null,
              player1Score: set.slots[0].standing?.stats?.score?.value || null,
              player2Score: set.slots[1].standing?.stats?.score?.value || null,
              winnerId: set.winnerId?.toString() || null,
              round: set.fullRoundText,
              bettingOpen: status === 'SCHEDULED', // Auto-enable betting for scheduled matches
            },
          })
        }

        matchesImported++
      } catch (error) {
        console.error(`Error importing set ${set.id}:`, error)
        // Continue with next match
      }
    }

    return matchesImported
  }

  /**
   * Find existing player or create new one
   */
  private async findOrCreatePlayer(gamerTag: string, startGgId?: string) {
    // Try to find by start.gg ID first if available
    if (startGgId) {
      const existingPlayer = await prisma.player.findUnique({
        where: { startGgId },
      })
      if (existingPlayer) {
        return existingPlayer
      }
    }

    // Try to find by gamerTag
    let player = await prisma.player.findUnique({
      where: { gamerTag },
    })

    if (!player) {
      // Create new player
      player = await prisma.player.create({
        data: {
          gamerTag,
          startGgId: startGgId || null,
        },
      })
    } else if (startGgId && !player.startGgId) {
      // Update player with start.gg ID if we have it and they don't
      player = await prisma.player.update({
        where: { id: player.id },
        data: { startGgId },
      })
    }

    return player
  }
}
