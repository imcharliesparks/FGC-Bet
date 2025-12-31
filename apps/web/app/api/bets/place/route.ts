import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { BettingService } from '@/lib/betting/betting-service'
import { z } from 'zod'
import { BetType, BetSelection } from '@repo/database'

const placeBetSchema = z.object({
  matchId: z.string(),
  betType: z.nativeEnum(BetType),
  selection: z.nativeEnum(BetSelection),
  amount: z.number().positive().int(),
})

export async function POST(request: Request) {
  try {
    const user = await requireAuth()

    const body = await request.json()
    const data = placeBetSchema.parse(body)

    const bettingService = new BettingService()
    const bet = await bettingService.placeBet({
      userId: user.id,
      ...data,
    })

    // Convert Decimal types for JSON serialization
    const serializedBet = {
      ...bet,
      amount: Number(bet.amount),
      odds: Number(bet.odds),
      potentialPayout: Number(bet.potentialPayout),
      actualPayout: bet.actualPayout ? Number(bet.actualPayout) : null,
      match: {
        ...bet.match,
        player1Score: bet.match.player1Score,
        player2Score: bet.match.player2Score,
      },
    }

    return NextResponse.json({ bet: serializedBet })
  } catch (error: any) {
    console.error('Place bet error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to place bet' },
      { status: 500 }
    )
  }
}
