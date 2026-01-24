import { api } from '@/lib/trpc/react'
import { useEffect, useState } from 'react'
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
  const [liveOdds, setLiveOdds] = useState(data)

  // Merge initial data
  useEffect(() => {
    if (data) setLiveOdds(data)
  }, [data])

  // Apply real-time updates
  useEffect(() => {
    if (oddsUpdate) {
      setLiveOdds((prev) => ({
        ...prev,
        player1Odds: oddsUpdate.player1Odds,
        player2Odds: oddsUpdate.player2Odds,
        player1Volume: oddsUpdate.player1Volume,
        player2Volume: oddsUpdate.player2Volume,
      }))
    }
  }, [oddsUpdate])

  return {
    odds: liveOdds,
    isLoading,
    error,
    isLive: !!oddsUpdate,
  }
}
