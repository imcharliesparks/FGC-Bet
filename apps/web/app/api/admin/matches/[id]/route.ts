import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/helpers'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { MatchStatus } from '@repo/database'
import { getEventBus } from '@/lib/realtime/event-bus'

const updateMatchSchema = z.object({
  status: z.nativeEnum(MatchStatus).optional(),
  player1Score: z.number().int().min(0).optional().nullable(),
  player2Score: z.number().int().min(0).optional().nullable(),
  winnerId: z.string().optional().nullable(),
  actualStart: z.string().datetime().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
  bettingOpen: z.boolean().optional(),
  streamUrl: z.string().url().optional().nullable(),
  vodUrl: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        player1: true,
        player2: true,
        tournament: true,
        _count: {
          select: { bets: true },
        },
      },
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    return NextResponse.json({ match })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch match' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await context.params

    const body = await request.json()
    const data = updateMatchSchema.parse(body)

    // Convert datetime strings to Date objects
    const updateData: any = { ...data }
    if (data.actualStart) updateData.actualStart = new Date(data.actualStart)
    if (data.completedAt) updateData.completedAt = new Date(data.completedAt)

    // Close betting when match starts
    if (data.status === 'LIVE') {
      updateData.bettingOpen = false
      updateData.bettingClosedAt = new Date()
    }

    const match = await prisma.match.update({
      where: { id },
      data: updateData,
      include: {
        player1: true,
        player2: true,
        tournament: true,
      },
    })

    // If match is completed, settle all bets
    if (data.status === 'COMPLETED' && data.winnerId) {
      // This will be implemented in Phase 3
      // await settleBets(match.id, data.winnerId)
      console.log(`Match ${id} completed. Bet settlement to be implemented in Phase 3.`)
    }

    // Publish match update event
    const eventBus = getEventBus()
    await eventBus.publishMatchUpdate(id, {
      status: match.status,
      player1Score: match.player1Score,
      player2Score: match.player2Score,
      bettingOpen: match.bettingOpen,
      winnerId: match.winnerId,
    })

    return NextResponse.json({ match })
  } catch (error: any) {
    console.error('Update match error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update match' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await context.params

    // Check if match has any bets
    const betCount = await prisma.bet.count({
      where: { matchId: id },
    })

    if (betCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete match with existing bets. Cancel the match instead.' },
        { status: 400 }
      )
    }

    await prisma.match.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete match' },
      { status: 500 }
    )
  }
}
