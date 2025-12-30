import { NextResponse } from 'next/server'
import { OddsService } from '@/lib/betting/odds-service'
import { BetType } from '@repo/database'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const betType = (searchParams.get('betType') || 'MONEYLINE') as BetType

    const oddsService = new OddsService()
    const odds = await oddsService.getCurrentOdds(id, betType)

    return NextResponse.json({ odds })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch odds' },
      { status: 500 }
    )
  }
}
