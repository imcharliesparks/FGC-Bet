'use client'

import { useEffect, useState } from 'react'
import { useRealtimeEvents } from './useRealtimeEvents'

export interface BetPlaced {
  id: string
  amount: number
  odds: number
  potentialPayout: number
}

export function useUserBetUpdates(userId: string | null | undefined) {
  const { isConnected, lastEvent } = useRealtimeEvents(
    userId ? `user:${userId}` : ''
  )
  const [betPlaced, setBetPlaced] = useState<BetPlaced | null>(null)

  useEffect(() => {
    if (!lastEvent) return

    if (lastEvent.type === 'bet:placed') {
      setBetPlaced(lastEvent.data)

      // Clear after a delay
      const timer = setTimeout(() => setBetPlaced(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [lastEvent])

  return {
    isConnected,
    betPlaced,
  }
}
