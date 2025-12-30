import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Match {
  id: string
  status: string
  game: string
  scheduledStart: Date
  bettingOpen: boolean
  player1Score: number | null
  player2Score: number | null
  round: string | null
  player1: {
    id: string
    gamerTag: string
    imageUrl: string | null
    eloRating: number
  }
  player2: {
    id: string
    gamerTag: string
    imageUrl: string | null
    eloRating: number
  }
  tournament: {
    id: string
    name: string
  } | null
}

// Fetch available matches (betting open or live)
export function useMatches() {
  return useQuery({
    queryKey: ['matches', 'available'],
    queryFn: async (): Promise<Match[]> => {
      const response = await fetch('/api/matches?status=available')
      if (!response.ok) {
        throw new Error('Failed to fetch matches')
      }
      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds - relatively fresh for betting
    refetchInterval: 60 * 1000, // Refetch every minute
    refetchOnWindowFocus: true, // Refetch when user comes back
  })
}

// Fetch a single match by ID
export function useMatch(matchId: string) {
  return useQuery({
    queryKey: ['matches', matchId],
    queryFn: async (): Promise<Match> => {
      const response = await fetch(`/api/matches/${matchId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch match')
      }
      return response.json()
    },
    enabled: !!matchId,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for live updates
  })
}

// Place a bet mutation
export function usePlaceBet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      matchId,
      selection,
      amount,
    }: {
      matchId: string
      selection: 'PLAYER_1' | 'PLAYER_2'
      amount: number
    }) => {
      const response = await fetch('/api/bets/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchId, selection, amount }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to place bet')
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch matches to get updated odds
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      // Invalidate user bets
      queryClient.invalidateQueries({ queryKey: ['bets'] })
      // Invalidate user balance
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

// Fetch user's bets
export function useUserBets(status?: 'PENDING' | 'WON' | 'LOST') {
  return useQuery({
    queryKey: ['bets', status || 'all'],
    queryFn: async () => {
      const url = status ? `/api/bets?status=${status}` : '/api/bets'
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch bets')
      }
      return response.json()
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}
