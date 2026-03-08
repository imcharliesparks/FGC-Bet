import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { MassImportService } from '@/lib/startgg/mass-import'
import { getEventBus } from '@/lib/realtime/event-bus'
import {
  TWOXKO_IMPORT_START_DATE,
  TWOXKO_VIDEOGAME_NAME,
} from '@/lib/startgg/constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Store active imports in memory (for this server instance)
const activeImports = new Map<string, MassImportService>()

/**
 * POST - Start a new import job
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add admin check via Clerk public metadata

    const apiKey = process.env.STARTGG_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'STARTGG_API_KEY not configured' },
        { status: 500 }
      )
    }

    const service = new MassImportService(apiKey, {
      startDate: TWOXKO_IMPORT_START_DATE,
      videogameName: TWOXKO_VIDEOGAME_NAME,
    })

    const jobId = service.getJobId()
    activeImports.set(jobId, service)

    service
      .run()
      .catch((error) => {
        console.error(`[MassImport] Job ${jobId} failed:`, error)
      })
      .finally(() => {
        activeImports.delete(jobId)
      })

    return NextResponse.json({ jobId })
  } catch (error) {
    console.error('[MassImport] Error starting import:', error)
    return NextResponse.json(
      { error: 'Failed to start import' },
      { status: 500 }
    )
  }
}

/**
 * GET - SSE stream for progress updates
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')

  if (!jobId) {
    return new Response('jobId query parameter required', { status: 400 })
  }

  const encoder = new TextEncoder()
  const eventBus = getEventBus()

  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const sendEvent = async (data: unknown) => {
    try {
      const message = `data: ${JSON.stringify(data)}\n\n`
      await writer.write(encoder.encode(message))
    } catch {
      // Connection closed
    }
  }

  // Subscribe to import progress events
  const unsubscribe = await eventBus.subscribe(`import:${jobId}`, async (event) => {
    await sendEvent(event)
  })

  // Send heartbeat every 30 seconds
  const heartbeatInterval = setInterval(async () => {
    await sendEvent({ type: 'heartbeat', timestamp: Date.now() })
  }, 30000)

  // Cleanup on connection close
  request.signal.addEventListener('abort', () => {
    clearInterval(heartbeatInterval)
    unsubscribe()
    writer.close().catch(() => {})
  })

  // Send initial state from database
  const job = await prisma.startGGImportJob.findUnique({
    where: { id: jobId },
  })

  if (job) {
    await sendEvent({ type: 'initial', data: job })
  }

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
