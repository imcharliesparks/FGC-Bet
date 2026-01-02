import { BetStatus } from '@repo/database'
import { api } from '@/lib/trpc/react'

// Fetch available matches (betting open or live)
export function useMatches() {
  return api.matches.available.useQuery(undefined, {
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

// Fetch a single match by ID
export function useMatch(matchId: string) {
  return api.matches.byId.useQuery(
    { id: matchId },
    {
      enabled: !!matchId,
      staleTime: 10 * 1000,
      refetchInterval: 30 * 1000,
    }
  )
}

// Place a bet mutation
export function usePlaceBet() {
  const utils = api.useUtils()

  return api.bets.place.useMutation({
    onSuccess: () => {
      utils.matches.invalidate()
      utils.bets.invalidate()
      utils.wallet.invalidate()
    },
  })
}

// Fetch user's bets
export function useUserBets(status?: BetStatus) {
  return api.bets.list.useQuery(
    { status },
    {
      staleTime: 30 * 1000,
      refetchInterval: 60 * 1000,
    }
  )
}
