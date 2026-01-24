import { api } from '@/lib/trpc/react'
import { useMatchUpdates } from './useMatchUpdates'

export function useMatchOdds(matchId: string) {
  // Fetch initial odds via tRPC
  const { data, isLoading, error } = api.matches.odds.useQuery(
    { matchId, betType: 'MONEYLINE' },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      refetchOnWindowFocus: true,
    }
  )

  // Subscribe to real-time updates
  const { oddsUpdate } = useMatchUpdates(matchId)

  // Use real-time updates if available, otherwise fallback to tRPC data
  const odds = oddsUpdate || data

  return {
    odds,
    isLoading,
    error,
    isLive: !!oddsUpdate,
  }
}
