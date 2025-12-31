import { prisma } from '@/lib/db/prisma'
import { WalletService } from '@/lib/wallet/service'
import { Decimal } from '@prisma/client/runtime/library'
import { getEventBus } from '@/lib/realtime/event-bus'
import type { Prisma } from '@repo/database'

export class SettlementService {
  private walletService: typeof WalletService

  constructor() {
    this.walletService = WalletService
  }

  /**
   * Settle all bets for a completed match
   * Should be called when match status changes to COMPLETED
   */
  async settleMatch(matchId: string, winnerId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: true,
        player2: true,
      },
    })

    if (!match) {
      throw new Error('Match not found')
    }

    if (match.status !== 'COMPLETED') {
      throw new Error('Match is not completed')
    }

    // Get all pending bets for this match
    const pendingBets = await prisma.bet.findMany({
      where: {
        matchId,
        status: 'PENDING',
      },
      include: {
        user: true,
      },
    })

    console.log(`Settling ${pendingBets.length} bets for match ${matchId}`)

    let settledCount = 0
    let wonCount = 0
    let lostCount = 0

    for (const bet of pendingBets) {
      try {
        await this.settleBet(bet.id, winnerId)
        settledCount++

        // Determine if bet won or lost
        const didWin = this.didBetWin(bet.selection, winnerId, match.player1Id, match.player2Id)
        if (didWin) {
          wonCount++
        } else {
          lostCount++
        }
      } catch (error) {
        console.error(`Error settling bet ${bet.id}:`, error)
      }
    }

    console.log(`Settled ${settledCount} bets: ${wonCount} won, ${lostCount} lost`)

    const result = {
      totalBets: pendingBets.length,
      settledCount,
      wonCount,
      lostCount,
    }

    // Publish settlement event
    const eventBus = getEventBus()
    await eventBus.publishMatchSettled(matchId, result)

    return result
  }

  /**
   * Settle an individual bet
   */
  private async settleBet(betId: string, winnerId: string) {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const bet = await tx.bet.findUnique({
        where: { id: betId },
        include: {
          match: true,
        },
      })

      if (!bet) {
        throw new Error('Bet not found')
      }

      if (bet.status !== 'PENDING') {
        throw new Error('Bet is not pending')
      }

      // Determine if bet won
      const didWin = this.didBetWin(
        bet.selection,
        winnerId,
        bet.match.player1Id,
        bet.match.player2Id
      )

      if (didWin) {
        // User won - pay out
        const payout = Number(bet.potentialPayout)

        await this.walletService.addChips(
          bet.userId,
          payout,
          'BET_WON',
          `Won bet on match ${bet.matchId}`,
          betId
        )

        await tx.bet.update({
          where: { id: betId },
          data: {
            status: 'WON',
            settledAt: new Date(),
            actualPayout: new Decimal(payout),
          },
        })

        console.log(`Bet ${betId} won: ${payout} chips paid out`)
      } else {
        // User lost - no payout
        await tx.bet.update({
          where: { id: betId },
          data: {
            status: 'LOST',
            settledAt: new Date(),
            actualPayout: new Decimal(0),
          },
        })

        console.log(`Bet ${betId} lost`)
      }
    })
  }

  /**
   * Determine if a bet won based on selection and winner
   */
  private didBetWin(
    selection: string,
    winnerId: string,
    player1Id: string,
    player2Id: string
  ): boolean {
    if (selection === 'PLAYER_1') {
      return winnerId === player1Id
    } else if (selection === 'PLAYER_2') {
      return winnerId === player2Id
    }

    // For other bet types (OVER, UNDER) - to be implemented
    return false
  }

  /**
   * Cancel all bets for a match (if match is cancelled)
   */
  async cancelMatchBets(matchId: string) {
    const pendingBets = await prisma.bet.findMany({
      where: {
        matchId,
        status: 'PENDING',
      },
    })

    let cancelledCount = 0

    for (const bet of pendingBets) {
      try {
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          // Refund chips
          await this.walletService.addChips(
            bet.userId,
            Number(bet.amount),
            'BET_REFUND',
            `Match cancelled: ${matchId}`,
            bet.id
          )

          // Update bet status
          await tx.bet.update({
            where: { id: bet.id },
            data: {
              status: 'CANCELLED',
              settledAt: new Date(),
            },
          })
        })

        cancelledCount++
      } catch (error) {
        console.error(`Error cancelling bet ${bet.id}:`, error)
      }
    }

    return {
      totalBets: pendingBets.length,
      cancelledCount,
    }
  }

  /**
   * Update player ELO ratings after match completion
   * Using standard ELO calculation
   */
  async updatePlayerRatings(matchId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: true,
        player2: true,
      },
    })

    if (!match || !match.winnerId) {
      return
    }

    const K_FACTOR = 32 // ELO K-factor

    const player1Rating = match.player1.eloRating
    const player2Rating = match.player2.eloRating

    // Expected scores
    const expectedPlayer1 = 1 / (1 + Math.pow(10, (player2Rating - player1Rating) / 400))
    const expectedPlayer2 = 1 - expectedPlayer1

    // Actual scores
    const actualPlayer1 = match.winnerId === match.player1Id ? 1 : 0
    const actualPlayer2 = match.winnerId === match.player2Id ? 1 : 0

    // New ratings
    const newPlayer1Rating = Math.round(
      player1Rating + K_FACTOR * (actualPlayer1 - expectedPlayer1)
    )
    const newPlayer2Rating = Math.round(
      player2Rating + K_FACTOR * (actualPlayer2 - expectedPlayer2)
    )

    // Update player records
    await prisma.$transaction([
      prisma.player.update({
        where: { id: match.player1Id },
        data: {
          eloRating: newPlayer1Rating,
          wins: actualPlayer1 === 1 ? { increment: 1 } : undefined,
          losses: actualPlayer1 === 0 ? { increment: 1 } : undefined,
          totalMatches: { increment: 1 },
        },
      }),
      prisma.player.update({
        where: { id: match.player2Id },
        data: {
          eloRating: newPlayer2Rating,
          wins: actualPlayer2 === 1 ? { increment: 1 } : undefined,
          losses: actualPlayer2 === 0 ? { increment: 1 } : undefined,
          totalMatches: { increment: 1 },
        },
      }),
    ])

    console.log(
      `Updated ELO: ${match.player1.gamerTag} ${player1Rating} → ${newPlayer1Rating}, ` +
        `${match.player2.gamerTag} ${player2Rating} → ${newPlayer2Rating}`
    )

    return {
      player1: {
        oldRating: player1Rating,
        newRating: newPlayer1Rating,
        change: newPlayer1Rating - player1Rating,
      },
      player2: {
        oldRating: player2Rating,
        newRating: newPlayer2Rating,
        change: newPlayer2Rating - player2Rating,
      },
    }
  }
}
