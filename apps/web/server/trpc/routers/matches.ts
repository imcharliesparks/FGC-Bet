import { z } from 'zod'
import { BetType, MatchStatus } from '@repo/database'
import { prisma } from '@/lib/db/prisma'
import { OddsService } from '@/lib/betting/odds-service'
import { publicProcedure, router } from '../trpc'
import { type Prisma } from '@prisma/client'
import fs from 'fs'
import path from 'path'

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

const getMockData = () => {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'mock-matches.json')
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as MatchWithDetails[]
    }
  } catch (error) {
    console.warn('Failed to load mock data:', error)
  }
  return null
}

const isMockMode = () => {
  return process.env.NODE_ENV === 'development' && process.env.USE_MOCK_DATA === 'true'
}


export const matchesRouter = router({
  available: publicProcedure.query(async () => {
    if (isMockMode()) {
       const mockMatches = getMockData()
       if (mockMatches) {
         return {
           matches: mockMatches,
           upcomingTournaments: mockMatches.map(m => m.tournament).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i).map((t: any) => ({...t, _count: { matches: mockMatches.filter(m => m.tournamentId === t.id).length }}))
         }
       }
    }

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
    if (isMockMode()) {
      const mockMatches = getMockData()
      const match = mockMatches?.find(m => m.id === input.id)
      if (match) return match
    }

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
      if (isMockMode()) {
         let mockMatches = getMockData() || []
         if (input?.status) mockMatches = mockMatches.filter(m => m.status === input.status)
         if (input?.tournamentId) mockMatches = mockMatches.filter(m => m.tournamentId === input.tournamentId)
         return mockMatches
      }

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
      if (isMockMode()) {
          return {
            player1Odds: -150,
            player2Odds: 120,
            player1Volume: 0,
            player2Volume: 0,
          }
      }

      const odds = await oddsService.getCurrentOdds(input.matchId, input.betType)
      return odds
    }),
})
