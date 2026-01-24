import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { BettingService } from '@/lib/betting/betting-service'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await context.params

    const bettingService = new BettingService()
    const bet = await bettingService.getBet(id)

    if (!bet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 })
    }

    // Verify ownership
    if (bet.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Serialize Decimal types
    const serializedBet = {
      ...bet,
      amount: Number(bet.amount),
      odds: Number(bet.odds),
      potentialPayout: Number(bet.potentialPayout),
      actualPayout: bet.actualPayout ? Number(bet.actualPayout) : null,
    }

    return NextResponse.json({ bet: serializedBet })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch bet'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await context.params

    const bettingService = new BettingService()
    const bet = await bettingService.cancelBet(id, user.id)

    return NextResponse.json({
      success: true,
      bet: {
        ...bet,
        amount: Number(bet.amount),
        odds: Number(bet.odds),
        potentialPayout: Number(bet.potentialPayout),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to cancel bet'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
