import { prisma } from '@/lib/db/prisma'
import { WalletService } from '@/lib/wallet/service'
import { OddsService } from './odds-service'
import { OddsCalculator } from './odds-calculator'
import { BetType, BetSelection, BetStatus, type Prisma } from '@repo/database'
import { Decimal } from '@prisma/client/runtime/library'
import { getEventBus } from '@/lib/realtime/event-bus'

export interface PlaceBetParams {
  userId: string
  matchId: string
  betType: BetType
  selection: BetSelection
  amount: number
}

export class BettingService {
  private oddsService: OddsService
  private calculator: OddsCalculator
  private walletService: typeof WalletService

  constructor() {
    this.oddsService = new OddsService()
    this.calculator = new OddsCalculator()
    this.walletService = WalletService
  }

  /**
   * Place a bet on a match
   * Validates match status, user balance, and locks in current odds
   */
  async placeBet(params: PlaceBetParams) {
    const { userId, matchId, betType, selection, amount } = params

    // Validation
    if (amount <= 0) {
      throw new Error('Bet amount must be greater than 0')
    }

    // Use Prisma transaction for atomicity
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Get match and verify it's open for betting
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: {
          player1: true,
          player2: true,
        },
      })

      if (!match) {
        throw new Error('Match not found')
      }

      if (!match.bettingOpen) {
        throw new Error('Betting is closed for this match')
      }

      if (match.status !== 'SCHEDULED') {
        throw new Error('Can only bet on scheduled matches')
      }

      // 2. Verify user has sufficient balance
      const canPlaceBet = await this.walletService.canPlaceBet(userId, amount)
      if (!canPlaceBet) {
        throw new Error('Insufficient chips')
      }

      // 3. Get current odds
      const currentOdds = await this.oddsService.getCurrentOdds(matchId, betType)

      // Determine odds for this selection
      let oddsForSelection: number
      if (betType === 'MONEYLINE') {
        if (selection === 'PLAYER_1') {
          oddsForSelection = currentOdds.player1Odds
        } else if (selection === 'PLAYER_2') {
          oddsForSelection = currentOdds.player2Odds
        } else {
          throw new Error('Invalid selection for MONEYLINE bet')
        }
      } else {
        throw new Error('Only MONEYLINE bets are supported currently')
      }

      // 4. Calculate potential payout
      const potentialPayout = this.calculator.calculatePayout(amount, oddsForSelection)

      // 5. Deduct chips from user's wallet
      await this.walletService.deductChips(
        userId,
        amount,
        'BET_PLACED',
        `Bet on ${match.player1.gamerTag} vs ${match.player2.gamerTag}`
      )

      // 6. Create bet record
      const bet = await tx.bet.create({
        data: {
          userId,
          matchId,
          betType,
          selection,
          amount: new Decimal(amount),
          odds: new Decimal(oddsForSelection),
          potentialPayout: new Decimal(potentialPayout),
          status: 'PENDING',
        },
        include: {
          match: {
            include: {
              player1: true,
              player2: true,
            },
          },
        },
      })

      // 7. Update odds based on new bet volume
      const newOdds = await this.oddsService.updateOddsAfterBet(
        matchId,
        betType,
        selection,
        amount
      )

      // 8. Publish real-time events
      const eventBus = getEventBus()

      // Notify user of bet placement
      await eventBus.publishBetPlaced(userId, {
        id: bet.id,
        amount: Number(bet.amount),
        odds: Number(bet.odds),
        potentialPayout: Number(bet.potentialPayout),
      })

      // Notify match watchers of new odds
      await eventBus.publishOddsUpdate(matchId, newOdds)

      return bet
    })
  }

  /**
   * Get user's active bets
   */
  async getUserActiveBets(userId: string) {
    return await prisma.bet.findMany({
      where: {
        userId,
        status: 'PENDING',
      },
      include: {
        match: {
          include: {
            player1: true,
            player2: true,
            tournament: true,
          },
        },
      },
      orderBy: {
        placedAt: 'desc',
      },
    })
  }

  /**
   * Get user's bet history
   */
  async getUserBetHistory(userId: string, limit = 50) {
    return await prisma.bet.findMany({
      where: {
        userId,
      },
      include: {
        match: {
          include: {
            player1: true,
            player2: true,
            tournament: true,
          },
        },
      },
      orderBy: {
        placedAt: 'desc',
      },
      take: limit,
    })
  }

  /**
   * Get bet details
   */
  async getBet(betId: string) {
    return await prisma.bet.findUnique({
      where: { id: betId },
      include: {
        match: {
          include: {
            player1: true,
            player2: true,
            tournament: true,
          },
        },
        user: true,
      },
    })
  }

  /**
   * Cancel a bet (only if match hasn't started)
   */
  async cancelBet(betId: string, userId: string) {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const bet = await tx.bet.findUnique({
        where: { id: betId },
        include: { match: true },
      })

      if (!bet) {
        throw new Error('Bet not found')
      }

      if (bet.userId !== userId) {
        throw new Error('Unauthorized')
      }

      if (bet.status !== 'PENDING') {
        throw new Error('Can only cancel pending bets')
      }

      if (bet.match.status !== 'SCHEDULED') {
        throw new Error('Cannot cancel bet after match has started')
      }

      // Refund chips to user
      await this.walletService.addChips(
        userId,
        Number(bet.amount),
        'BET_REFUND',
        `Bet cancelled: ${betId}`,
        betId
      )

      // Update bet status
      return await tx.bet.update({
        where: { id: betId },
        data: {
          status: 'CANCELLED',
        },
      })
    })
  }

  /**
   * Get betting statistics for a user
   */
  async getUserStats(userId: string) {
    const [totalBets, wonBets, lostBets, pendingBets] = await Promise.all([
      prisma.bet.count({ where: { userId } }),
      prisma.bet.count({ where: { userId, status: 'WON' } }),
      prisma.bet.count({ where: { userId, status: 'LOST' } }),
      prisma.bet.count({ where: { userId, status: 'PENDING' } }),
    ])

    const allBets = await prisma.bet.findMany({
      where: { userId },
    })

    const totalWagered = allBets.reduce<number>(
      (sum, bet) => sum + Number(bet.amount),
      0
    )
    const totalWon = allBets
      .filter((bet) => bet.status === 'WON')
      .reduce<number>((sum, bet) => sum + Number(bet.actualPayout || 0), 0)

    const netProfit = totalWon - totalWagered
    const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0

    return {
      totalBets,
      wonBets,
      lostBets,
      pendingBets,
      totalWagered,
      totalWon,
      netProfit,
      winRate,
    }
  }
}
