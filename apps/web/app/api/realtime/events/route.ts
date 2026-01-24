import { getEventBus } from '@/lib/realtime/event-bus'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Server-Sent Events endpoint for real-time updates
 * Clients subscribe to channels via query parameter
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const channel = searchParams.get('channel')

  if (!channel) {
    return new Response('Channel parameter required', { status: 400 })
  }

  const encoder = new TextEncoder()
  const eventBus = getEventBus()

  // Create a TransformStream for SSE
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  // Send initial connection message
  const sendEvent = async (event: unknown) => {
    const data = `data: ${JSON.stringify(event)}\n\n`
    await writer.write(encoder.encode(data))
  }

  // Send heartbeat to keep connection alive
  const heartbeatInterval = setInterval(async () => {
    try {
      await sendEvent({ type: 'heartbeat', timestamp: Date.now() })
    } catch {
      clearInterval(heartbeatInterval)
    }
  }, 30000) // Every 30 seconds

  // Subscribe to events
  const unsubscribe = await eventBus.subscribe(channel, async (event: unknown) => {
    try {
      await sendEvent(event)
    } catch (error) {
      console.error('Error sending event:', error)
    }
  })

  // Cleanup on connection close
  request.signal.addEventListener('abort', () => {
    clearInterval(heartbeatInterval)
    unsubscribe()
    writer.close()
  })

  // Send initial connection confirmation
  await sendEvent({
    type: 'connected',
    channel,
    timestamp: Date.now(),
  })

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })
}
