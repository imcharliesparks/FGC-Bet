import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/helpers'
import { SettlementService } from '@/lib/betting/settlement-service'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await context.params

    const match = await prisma.match.findUnique({
      where: { id },
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (match.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Match is not completed' },
        { status: 400 }
      )
    }

    if (!match.winnerId) {
      return NextResponse.json(
        { error: 'Winner must be set before settling bets' },
        { status: 400 }
      )
    }

    const settlementService = new SettlementService()

    // Settle all bets
    const settlementResult = await settlementService.settleMatch(id, match.winnerId)

    // Update player ELO ratings
    const ratingUpdate = await settlementService.updatePlayerRatings(id)

    return NextResponse.json({
      success: true,
      settlement: settlementResult,
      ratings: ratingUpdate,
    })
  } catch (error: any) {
    console.error('Settlement error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to settle match' },
      { status: 500 }
    )
  }
}
