import { z } from 'zod'
import { BetType, MatchStatus } from '@repo/database'
import { prisma } from '@/lib/db/prisma'
import { OddsService } from '@/lib/betting/odds-service'
import { publicProcedure, router } from '../trpc'
import { type Prisma } from '@prisma/client'

const oddsService = new OddsService()

type MatchWithDetails = Prisma.MatchGetPayload<{
  include: {
    player1: true
    player2: true
    tournament: true
  }
}> & {
  _count?: {
    bets: number
  }
}

const serializeMatch = (match: MatchWithDetails) => ({
  ...match,
  player1Score: match.player1Score,
  player2Score: match.player2Score,
})

export const matchesRouter = router({
  available: publicProcedure.query(async () => {
    const now = new Date()

    const matches = await prisma.match.findMany({
      where: {
        game: { not: 'OTHER' },
        OR: [{ bettingOpen: true }, { status: 'LIVE' }],
      },
      include: {
        player1: true,
        player2: true,
        tournament: true,
      },
      orderBy: {
        scheduledStart: 'asc',
      },
      take: 50,
    })

    const upcomingTournaments = await prisma.tournament.findMany({
      where: {
        isActive: true,
        game: { not: 'OTHER' },
        startDate: { gte: now },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        game: true,
        startDate: true,
        endDate: true,
        location: true,
        imageUrl: true,
        isFeatured: true,
        _count: { select: { matches: true } },
      },
      orderBy: { startDate: 'asc' },
      take: 6,
    })

    return {
      matches: matches.map(serializeMatch),
      upcomingTournaments,
    }
  }),

  byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const match = await prisma.match.findUnique({
      where: { id: input.id },
      include: {
        player1: true,
        player2: true,
        tournament: true,
      },
    })

    return match ? serializeMatch(match) : null
  }),

  list: publicProcedure
    .input(
      z
        .object({
          status: z.nativeEnum(MatchStatus).optional(),
          tournamentId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const where: Prisma.MatchWhereInput = {}
      if (input?.status) where.status = input.status
      if (input?.tournamentId) where.tournamentId = input.tournamentId

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

      return matches.map(serializeMatch)
    }),

  odds: publicProcedure
    .input(
      z.object({
        matchId: z.string(),
        betType: z.nativeEnum(BetType).default('MONEYLINE'),
      })
    )
    .query(async ({ input }) => {
      const odds = await oddsService.getCurrentOdds(input.matchId, input.betType)
      return odds
    }),
})
