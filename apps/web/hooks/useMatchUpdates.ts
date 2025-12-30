'use client'

import { useEffect, useState } from 'react'
import { useRealtimeEvents } from './useRealtimeEvents'

export interface MatchUpdate {
  status?: string
  player1Score?: number
  player2Score?: number
  bettingOpen?: boolean
  winnerId?: string | null
}

export function useMatchUpdates(matchId: string) {
  const { isConnected, lastEvent } = useRealtimeEvents(`match:${matchId}`)
  const [matchUpdate, setMatchUpdate] = useState<MatchUpdate | null>(null)
  const [oddsUpdate, setOddsUpdate] = useState<any>(null)
  const [settlement, setSettlement] = useState<any>(null)

  useEffect(() => {
    if (!lastEvent) return

    switch (lastEvent.type) {
      case 'match:update':
        setMatchUpdate(lastEvent.data)
        break
      case 'odds:update':
        setOddsUpdate(lastEvent.data)
        break
      case 'match:settled':
        setSettlement(lastEvent.data)
        break
    }
  }, [lastEvent])

  return {
    isConnected,
    matchUpdate,
    oddsUpdate,
    settlement,
  }
}
