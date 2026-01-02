import { z } from 'zod'
import { FightingGame, MatchStatus } from '@repo/database'
import { prisma } from '@/lib/db/prisma'
import { MatchImporter } from '@/lib/startgg/import'
import { SettlementService } from '@/lib/betting/settlement-service'
import { getEventBus } from '@/lib/realtime/event-bus'
import { adminProcedure, router } from '../trpc'

const createMatchInput = z.object({
  game: z.nativeEnum(FightingGame),
  tournamentId: z.string(),
  player1Id: z.string(),
  player2Id: z.string(),
  scheduledStart: z.string().datetime(),
  bestOf: z.number().int().min(1).max(7).default(3),
  round: z.string(),
  streamUrl: z.string().url().optional().nullable(),
  bettingOpen: z.boolean().default(true),
})

const updateMatchInput = z.object({
  status: z.nativeEnum(MatchStatus).optional(),
  player1Score: z.number().int().min(0).optional().nullable(),
  player2Score: z.number().int().min(0).optional().nullable(),
  winnerId: z.string().optional().nullable(),
  actualStart: z.string().datetime().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
  bettingOpen: z.boolean().optional(),
  streamUrl: z.string().url().optional().nullable(),
  vodUrl: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
})

const listMatchesInput = z
  .object({
    tournamentId: z.string().optional(),
    status: z.string().optional(),
  })
  .optional()

export const adminRouter = router({
  importTournament: adminProcedure
    .input(z.object({ tournamentSlug: z.string().min(3) }))
    .mutation(async ({ input }) => {
      if (!process.env.STARTGG_API_KEY) {
        throw new Error(
          'start.gg API key not configured. Please add STARTGG_API_KEY to the environment.'
        )
      }

      const importer = new MatchImporter(process.env.STARTGG_API_KEY)
      const result = await importer.importTournament(input.tournamentSlug)

      return {
        tournament: {
          id: result.tournament.id,
          name: result.tournament.name,
          slug: result.tournament.slug,
        },
        matchesImported: result.matchesImported,
      }
    }),

  createMatch: adminProcedure.input(createMatchInput).mutation(async ({ input }) => {
    const match = await prisma.match.create({
      data: {
        ...input,
        scheduledStart: new Date(input.scheduledStart),
        status: 'SCHEDULED',
      },
      include: {
        player1: true,
        player2: true,
        tournament: true,
      },
    })

    return match
  }),

  listMatches: adminProcedure.input(listMatchesInput).query(async ({ input }) => {
    const where: any = {}
    if (input?.tournamentId) where.tournamentId = input.tournamentId
    if (input?.status) where.status = input.status

    const matches = await prisma.match.findMany({
      where,
      include: {
        player1: true,
        player2: true,
        tournament: true,
        _count: { select: { bets: true } },
      },
      orderBy: { scheduledStart: 'desc' },
      take: 100,
    })

    return matches
  }),

  getMatch: adminProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const match = await prisma.match.findUnique({
      where: { id: input.id },
      include: {
        player1: true,
        player2: true,
        tournament: true,
        _count: { select: { bets: true } },
      },
    })

    return match
  }),

  updateMatch: adminProcedure.input(z.object({ id: z.string(), data: updateMatchInput })).mutation(
    async ({ input }) => {
      const { id, data } = input

      const updateData: any = { ...data }
      if (data.actualStart) updateData.actualStart = new Date(data.actualStart)
      if (data.completedAt) updateData.completedAt = new Date(data.completedAt)

      if (data.status === 'LIVE') {
        updateData.bettingOpen = false
        updateData.bettingClosedAt = new Date()
      }

      const match = await prisma.match.update({
        where: { id },
        data: updateData,
        include: {
          player1: true,
          player2: true,
          tournament: true,
        },
      })

      if (data.status === 'COMPLETED' && data.winnerId) {
        // Settlement handled by dedicated mutation
        console.log(`Match ${id} completed. Use settleMatch to settle bets.`)
      }

      const eventBus = getEventBus()
      await eventBus.publishMatchUpdate(id, {
        status: match.status,
        player1Score: match.player1Score,
        player2Score: match.player2Score,
        bettingOpen: match.bettingOpen,
        winnerId: match.winnerId,
      })

      return match
    }
  ),

  deleteMatch: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const betCount = await prisma.bet.count({
        where: { matchId: input.id },
      })

      if (betCount > 0) {
        throw new Error('Cannot delete match with existing bets. Cancel the match instead.')
      }

      await prisma.match.delete({ where: { id: input.id } })
      return { success: true }
    }),

  settleMatch: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const match = await prisma.match.findUnique({ where: { id: input.id } })

      if (!match) {
        throw new Error('Match not found')
      }

      if (match.status !== 'COMPLETED') {
        throw new Error('Match is not completed')
      }

      if (!match.winnerId) {
        throw new Error('Winner must be set before settling bets')
      }

      const settlementService = new SettlementService()
      const settlement = await settlementService.settleMatch(input.id, match.winnerId)
      const ratings = await settlementService.updatePlayerRatings(input.id)

      return { settlement, ratings }
    }),
})
