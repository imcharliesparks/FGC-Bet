'use client'

import { useEffect, useRef, useState } from 'react'

import { type RealtimeEvent } from '@/lib/realtime/event-bus'

export function useRealtimeEvents(channel: string, onEvent?: (event: RealtimeEvent) => void) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const onEventRef = useRef(onEvent)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    if (!channel) return

    // Create EventSource for Server-Sent Events
    const eventSource = new EventSource(
      `/api/realtime/events?channel=${encodeURIComponent(channel)}`
    )

    eventSource.onopen = () => {
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLastEvent(data)
        onEventRef.current?.(data)
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
