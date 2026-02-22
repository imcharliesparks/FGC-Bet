import { z } from 'zod'
import { BetType, MatchStatus } from '@repo/database'
import { prisma } from '@/lib/db/prisma'
import { OddsService } from '@/lib/betting/odds-service'
import { protectedProcedure, publicProcedure, router } from '../trpc'
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

  swipeable: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get IDs of matches user already dismissed (via raw SQL since UserMatchDismissal
      // isn't exposed on the runtime PrismaClient in Prisma v7)
      const dismissed = await prisma.$queryRawUnsafe<{ matchId: string }[]>(
        'SELECT "matchId" FROM "UserMatchDismissal" WHERE "userId" = $1',
        ctx.user!.id
      )
      const existingBets = await prisma.bet.findMany({
        where: { userId: ctx.user!.id, status: 'PENDING' },
        select: { matchId: true },
      })
      const excludeIds = [
        ...dismissed.map((d) => d.matchId),
        ...existingBets.map((b) => b.matchId),
      ]

      // Fetch bettable matches not in exclude list
      const matches = await prisma.match.findMany({
        where: {
          tournamentId: input.tournamentId,
          bettingOpen: true,
          status: 'SCHEDULED',
          ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
        },
        include: { player1: true, player2: true, tournament: true },
        orderBy: { scheduledStart: 'asc' },
        take: 20,
      })

      return matches.map(serializeMatch)
    }),

  skip: protectedProcedure
    .input(z.object({ matchId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Use raw SQL since UserMatchDismissal isn't on the runtime PrismaClient
      await prisma.$executeRawUnsafe(
        `INSERT INTO "UserMatchDismissal" ("id", "userId", "matchId", "reason", "createdAt")
         VALUES (gen_random_uuid(), $1, $2, 'SKIPPED', NOW())
         ON CONFLICT ("userId", "matchId") DO NOTHING`,
        ctx.user!.id,
        input.matchId
      )
      return { success: true }
    }),
})

