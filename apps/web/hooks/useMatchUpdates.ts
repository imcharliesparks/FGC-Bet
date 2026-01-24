import { useCallback, useState } from 'react'
import { useRealtimeEvents } from './useRealtimeEvents'
import {
  type MatchUpdate,
  type OddsUpdate,
  type MatchSettlement,
  type RealtimeEvent,
} from '@/lib/realtime/event-bus'

export interface MatchUpdatesOptions {
  onMatchUpdate?: (update: MatchUpdate) => void
  onOddsUpdate?: (update: OddsUpdate) => void
  onSettlement?: (settlement: MatchSettlement) => void
}

export function useMatchUpdates(
  matchId: string,
  options: MatchUpdatesOptions = {}
) {
  const { onMatchUpdate, onOddsUpdate, onSettlement } = options
  const [matchUpdate, setMatchUpdate] = useState<MatchUpdate | null>(null)
  const [oddsUpdate, setOddsUpdate] = useState<OddsUpdate | null>(null)
  const [settlement, setSettlement] = useState<MatchSettlement | null>(null)

  const handleEvent = useCallback(
    (event: RealtimeEvent) => {
      switch (event.type) {
        case 'match:update': {
          const update = event.data as MatchUpdate
          setMatchUpdate(update)
          onMatchUpdate?.(update)
          break
        }
        case 'odds:update': {
          const update = event.data as OddsUpdate
          setOddsUpdate(update)
          onOddsUpdate?.(update)
          break
        }
        case 'match:settled': {
          const update = event.data as MatchSettlement
          setSettlement(update)
          onSettlement?.(update)
          break
        }
      }
    },
    [onMatchUpdate, onOddsUpdate, onSettlement]
  )

  const { isConnected } = useRealtimeEvents(`match:${matchId}`, handleEvent)

  return {
    isConnected,
    matchUpdate,
    oddsUpdate,
    settlement,
  }
}
