'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRealtimeEvents } from './useRealtimeEvents'
import { type BetPlacedEvent, type RealtimeEvent } from '@/lib/realtime/event-bus'

export function useUserBetUpdates(userId: string | null | undefined) {
  const [betPlaced, setBetPlaced] = useState<BetPlacedEvent | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handleEvent = useCallback((event: RealtimeEvent) => {
    if (event.type === 'bet:placed') {
      if (timerRef.current) clearTimeout(timerRef.current)
      setBetPlaced(event.data as BetPlacedEvent)

      // Clear after a delay
      timerRef.current = setTimeout(() => setBetPlaced(null), 5000)
    }
  }, [])

  const { isConnected } = useRealtimeEvents(
    userId ? `user:${userId}` : '',
    handleEvent
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return {
    isConnected,
    betPlaced,
  }
}
