import { z } from 'zod'
import { WalletService } from '@/lib/wallet/service'
import { protectedProcedure, router } from '../trpc'

const transactionsInput = z.object({
  limit: z.number().int().min(1).max(200).default(50),
})

export const walletRouter = router({
  balance: protectedProcedure.query(async ({ ctx }) => {
    const balance = await WalletService.getBalance(ctx.user!.id)

    return {
      balance,
      userId: ctx.user!.id,
      username: ctx.user!.username,
    }
  }),

  transactions: protectedProcedure
    .input(transactionsInput.optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50
      const transactions = await WalletService.getTransactions(ctx.user!.id, limit)

      return transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
        balanceBefore: Number(t.balanceBefore),
        balanceAfter: Number(t.balanceAfter),
      }))
    }),
})
