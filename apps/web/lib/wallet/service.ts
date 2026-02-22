import { prisma } from '@/lib/db/prisma'
import { TransactionType } from '@repo/database'
import type { Prisma } from '@prisma/client'


export class WalletService {
  /**
   * Get user's current chip balance
   */
  static async getBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { chipBalance: true },
    })

    return Number(user?.chipBalance || 0)
  }

  /**
   * Add chips to wallet (for payouts and bonuses)
   */
  static async addChips(
    userId: string,
    amount: number,
    type: TransactionType,
    description?: string,
    relatedBetId?: string
  ) {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Get current balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { chipBalance: true },
      })

      if (!user) {
        throw new Error('User not found')
      }

      const balanceBefore = Number(user.chipBalance)
      const balanceAfter = balanceBefore + amount

      // Update user balance
      await tx.user.update({
        where: { id: userId },
        data: { chipBalance: balanceAfter },
      })

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type,
          amount: amount,
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          description: description || `${type}: ${amount} chips`,
          relatedBetId,
        },
      })

      return { transaction, newBalance: balanceAfter }
    })
  }

  /**
   * Deduct chips from wallet (for bet placement)
   */
  static async deductChips(
    userId: string,
    amount: number,
    type: TransactionType,
    description?: string,
    relatedBetId?: string
  ) {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Get current balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { chipBalance: true },
      })

      if (!user) {
        throw new Error('User not found')
      }

      const balanceBefore = Number(user.chipBalance)

      if (balanceBefore < amount) {
        throw new Error('Insufficient chips')
      }

      const balanceAfter = balanceBefore - amount

      // Update user balance
      await tx.user.update({
        where: { id: userId },
        data: { chipBalance: balanceAfter },
      })

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type,
          amount: amount,
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          description: description || `${type}: ${amount} chips`,
          relatedBetId,
        },
      })

      return { transaction, newBalance: balanceAfter }
    })
  }

  /**
   * Get transaction history for a user
   */
  static async getTransactions(userId: string, limit = 50) {
    return await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Check if user has sufficient chips to place a bet
   */
  static async canPlaceBet(userId: string, amount: number): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        chipBalance: true,
      },
    })

    if (!user) {
      return false
    }

    return Number(user.chipBalance) >= amount
  }

  /**
   * Give daily bonus chips to a user
   */
  static async giveDailyBonus(userId: string, amount = 100) {
    return await this.addChips(
      userId,
      amount,
      'DAILY_BONUS',
      `Daily bonus: ${amount} chips`
    )
  }
}
