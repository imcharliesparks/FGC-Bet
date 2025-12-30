import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { WalletService } from '@/lib/wallet/service'

export async function GET() {
  try {
    const user = await requireAuth()
    const balance = await WalletService.getBalance(user.id)

    return NextResponse.json({
      balance,
      userId: user.id,
      username: user.username,
    })
  } catch (error) {
    console.error('Error fetching balance:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch balance' },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500 }
    )
  }
}
