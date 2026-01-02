import { router } from '../trpc'
import { walletRouter } from './wallet'
import { betsRouter } from './bets'
import { matchesRouter } from './matches'
import { adminRouter } from './admin'

export const appRouter = router({
  wallet: walletRouter,
  bets: betsRouter,
  matches: matchesRouter,
  admin: adminRouter,
})

export type AppRouter = typeof appRouter
