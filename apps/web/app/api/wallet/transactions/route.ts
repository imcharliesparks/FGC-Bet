import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { WalletService } from '@/lib/wallet/service'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const transactions = await WalletService.getTransactions(user.id, limit)

    // Convert Decimal types to numbers for JSON serialization
    const serializedTransactions = transactions.map(t => ({
      ...t,
      amount: Number(t.amount),
      balanceBefore: Number(t.balanceBefore),
      balanceAfter: Number(t.balanceAfter),
    }))

    return NextResponse.json({ transactions: serializedTransactions })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch transactions' },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500 }
    )
  }
}
