import { z } from 'zod'
import { BetSelection, BetStatus, BetType } from '@repo/database'
import { BettingService } from '@/lib/betting/betting-service'
import { protectedProcedure, router } from '../trpc'
import { type Prisma } from '@prisma/client'

const placeBetInput = z.object({
  matchId: z.string(),
  betType: z.nativeEnum(BetType),
  selection: z.nativeEnum(BetSelection),
  amount: z.number().positive().int(),
})

const listBetsInput = z.object({
  status: z.nativeEnum(BetStatus).optional(),
  limit: z.number().int().min(1).max(200).default(50),
})

const betService = new BettingService()

interface SerializableBet {
  amount: Prisma.Decimal | number
  odds: Prisma.Decimal | number
  potentialPayout: Prisma.Decimal | number
  actualPayout?: Prisma.Decimal | number | null
  match?: {
    player1Score?: number | null
    player2Score?: number | null
  } | null
}

const serializeBet = <T extends SerializableBet>(bet: T) => ({
  ...bet,
  amount: Number(bet.amount),
  odds: Number(bet.odds),
  potentialPayout: Number(bet.potentialPayout),
  actualPayout: bet.actualPayout ? Number(bet.actualPayout) : null,
  match: bet.match ? {
    ...bet.match,
    player1Score: bet.match.player1Score,
    player2Score: bet.match.player2Score,
  } : null,
})

export const betsRouter = router({
  place: protectedProcedure.input(placeBetInput).mutation(async ({ ctx, input }) => {
    const bet = await betService.placeBet({
      userId: ctx.user!.id,
      ...input,
    })

    return serializeBet(bet)
  }),

  list: protectedProcedure.input(listBetsInput.optional()).query(async ({ ctx, input }) => {
    const limit = input?.limit ?? 50
    if (input?.status === 'PENDING') {
      const bets = await betService.getUserActiveBets(ctx.user!.id)
      return bets.slice(0, limit).map(serializeBet)
    }

    const bets = await betService.getUserBetHistory(ctx.user!.id, limit)
    const filtered = input?.status ? bets.filter((b) => b.status === input.status) : bets
    return filtered.map(serializeBet)
  }),

  get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const bet = await betService.getBet(input.id)
    if (!bet || bet.userId !== ctx.user!.id) {
      return null
    }
    return serializeBet(bet)
  }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const bet = await betService.cancelBet(input.id, ctx.user!.id)
      return serializeBet(bet)
    }),
})
