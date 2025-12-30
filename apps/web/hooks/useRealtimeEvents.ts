'use client'

import { useEffect, useRef, useState } from 'react'

export interface RealtimeEvent {
  type: string
  data: any
  timestamp: number
}

export function useRealtimeEvents(channel: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!channel) return

    // Create EventSource for Server-Sent Events
    const eventSource = new EventSource(
      `/api/realtime/events?channel=${encodeURIComponent(channel)}`
    )

    eventSource.onopen = () => {
      console.log(`SSE connected to channel: ${channel}`)
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLastEvent(data)
      } catch (error) {
        console.error('Error parsing SSE message:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
      setIsConnected(false)
    }

    eventSourceRef.current = eventSource

    // Cleanup on unmount
    return () => {
      eventSource.close()
      eventSourceRef.current = null
      setIsConnected(false)
    }
  }, [channel])

  return { isConnected, lastEvent }
}
