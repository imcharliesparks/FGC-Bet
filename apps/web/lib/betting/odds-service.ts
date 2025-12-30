import { prisma } from '@/lib/db/prisma'
import { OddsCalculator } from './odds-calculator'
import { BetType } from '@repo/database'
import { Decimal } from '@prisma/client/runtime/library'

export class OddsService {
  private calculator: OddsCalculator

  constructor() {
    this.calculator = new OddsCalculator()
  }

  /**
   * Initialize odds for a new match
   * Creates initial odds snapshot based on player ELO ratings
   */
  async initializeMatchOdds(matchId: string) {
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

    // Calculate initial probabilities based on ELO
    const probabilities = this.calculator.calculateWinProbability(
      {
        eloRating: match.player1.eloRating,
        wins: match.player1.wins,
        losses: match.player1.losses,
        totalMatches: match.player1.totalMatches,
      },
      {
        eloRating: match.player2.eloRating,
        wins: match.player2.wins,
        losses: match.player2.losses,
        totalMatches: match.player2.totalMatches,
      }
    )

    // Convert to American odds
    const player1Odds = this.calculator.probabilityToAmericanOdds(
      probabilities.player1WinProb
    )
    const player2Odds = this.calculator.probabilityToAmericanOdds(
      probabilities.player2WinProb
    )

    // Create initial moneyline odds snapshot
    const oddsSnapshot = await prisma.oddsSnapshot.create({
      data: {
        matchId,
        betType: 'MONEYLINE',
        player1Odds: new Decimal(player1Odds),
        player2Odds: new Decimal(player2Odds),
        player1Volume: new Decimal(0),
        player2Volume: new Decimal(0),
      },
    })

    return {
      player1Odds,
      player2Odds,
      snapshot: oddsSnapshot,
    }
  }

  /**
   * Get current (latest) odds for a match
   */
  async getCurrentOdds(matchId: string, betType: BetType = 'MONEYLINE') {
    const latestSnapshot = await prisma.oddsSnapshot.findFirst({
      where: {
        matchId,
        betType,
      },
      orderBy: {
        timestamp: 'desc',
      },
    })

    if (!latestSnapshot) {
      // Initialize odds if they don't exist
      const initialized = await this.initializeMatchOdds(matchId)
      return {
        player1Odds: initialized.player1Odds,
        player2Odds: initialized.player2Odds,
        player1Volume: 0,
        player2Volume: 0,
      }
    }

    return {
      player1Odds: Number(latestSnapshot.player1Odds),
      player2Odds: Number(latestSnapshot.player2Odds),
      player1Volume: Number(latestSnapshot.player1Volume),
      player2Volume: Number(latestSnapshot.player2Volume),
    }
  }

  /**
   * Get odds history for a match
   */
  async getOddsHistory(matchId: string, betType: BetType = 'MONEYLINE') {
    return await prisma.oddsSnapshot.findMany({
      where: {
        matchId,
        betType,
      },
      orderBy: {
        timestamp: 'asc',
      },
    })
  }

  /**
   * Update odds after a new bet is placed
   * Creates a new snapshot with adjusted odds
   */
  async updateOddsAfterBet(
    matchId: string,
    betType: BetType,
    playerSelection: 'PLAYER_1' | 'PLAYER_2',
    betAmount: number
  ) {
    // Get current odds
    const currentOdds = await this.getCurrentOdds(matchId, betType)

    // Calculate new volumes
    const newPlayer1Volume =
      currentOdds.player1Volume + (playerSelection === 'PLAYER_1' ? betAmount : 0)
    const newPlayer2Volume =
      currentOdds.player2Volume + (playerSelection === 'PLAYER_2' ? betAmount : 0)

    const totalVolume = newPlayer1Volume + newPlayer2Volume

    // Adjust odds based on volume
    const adjustedPlayer1Odds = this.calculator.adjustOddsForVolume(
      currentOdds.player1Odds,
      totalVolume,
      newPlayer1Volume
    )

    const adjustedPlayer2Odds = this.calculator.adjustOddsForVolume(
      currentOdds.player2Odds,
      totalVolume,
      newPlayer2Volume
    )

    // Create new odds snapshot
    const newSnapshot = await prisma.oddsSnapshot.create({
      data: {
        matchId,
        betType,
        player1Odds: new Decimal(adjustedPlayer1Odds),
        player2Odds: new Decimal(adjustedPlayer2Odds),
        player1Volume: new Decimal(newPlayer1Volume),
        player2Volume: new Decimal(newPlayer2Volume),
      },
    })

    return {
      player1Odds: adjustedPlayer1Odds,
      player2Odds: adjustedPlayer2Odds,
      player1Volume: newPlayer1Volume,
      player2Volume: newPlayer2Volume,
      snapshot: newSnapshot,
    }
  }

  /**
   * Check if odds need significant adjustment (for manual review)
   */
  async checkOddsHealth(matchId: string): Promise<{
    healthy: boolean
    issues: string[]
  }> {
    const currentOdds = await this.getCurrentOdds(matchId)
    const issues: string[] = []

    const totalVolume = currentOdds.player1Volume + currentOdds.player2Volume

    // Check for heavy one-sided betting
    if (totalVolume > 0) {
      const player1Ratio = currentOdds.player1Volume / totalVolume

      if (player1Ratio > 0.8) {
        issues.push('Over 80% of bets on Player 1')
      } else if (player1Ratio < 0.2) {
        issues.push('Over 80% of bets on Player 2')
      }
    }

    // Check for extreme odds
    if (Math.abs(currentOdds.player1Odds) > 1000 || Math.abs(currentOdds.player2Odds) > 1000) {
      issues.push('Extreme odds detected - manual review recommended')
    }

    return {
      healthy: issues.length === 0,
      issues,
    }
  }
}
