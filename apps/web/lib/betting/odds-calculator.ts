export interface PlayerStats {
  eloRating: number
  wins: number
  losses: number
  totalMatches: number
}

export class OddsCalculator {
  private readonly HOUSE_EDGE = 0.05 // 5% house edge
  private readonly MIN_ODDS = -10000 // Minimum American odds
  private readonly MAX_ODDS = 10000 // Maximum American odds

  /**
   * Calculate win probability using ELO rating system
   * Formula: P(A beats B) = 1 / (1 + 10^((RB - RA) / 400))
   */
  calculateWinProbability(
    player1Stats: PlayerStats,
    player2Stats: PlayerStats
  ): { player1WinProb: number; player2WinProb: number } {
    const ratingDiff = player1Stats.eloRating - player2Stats.eloRating

    // ELO formula
    const player1WinProb = 1 / (1 + Math.pow(10, -ratingDiff / 400))
    const player2WinProb = 1 - player1WinProb

    // Ensure probabilities are valid (avoid extreme values)
    return {
      player1WinProb: Math.max(0.05, Math.min(0.95, player1WinProb)),
      player2WinProb: Math.max(0.05, Math.min(0.95, player2WinProb)),
    }
  }

  /**
   * Convert probability to American odds with house edge
   * @param probability - Win probability (0-1)
   * @returns American odds (e.g., -150, +200)
   */
  probabilityToAmericanOdds(probability: number): number {
    // Add house edge to probability (making it harder to win)
    const adjustedProb = probability * (1 + this.HOUSE_EDGE)

    // Ensure probability doesn't exceed 0.99
    const finalProb = Math.min(0.99, Math.max(0.01, adjustedProb))

    let americanOdds: number

    if (finalProb >= 0.5) {
      // Favorite (negative odds)
      americanOdds = Math.round((-100 * finalProb) / (1 - finalProb))
    } else {
      // Underdog (positive odds)
      americanOdds = Math.round((100 * (1 - finalProb)) / finalProb)
    }

    // Clamp odds within reasonable bounds
    return Math.max(this.MIN_ODDS, Math.min(this.MAX_ODDS, americanOdds))
  }

  /**
   * Adjust odds based on betting volume (market-making)
   * This helps balance the book and manage liability
   */
  adjustOddsForVolume(
    currentOdds: number,
    totalBetAmount: number,
    betAmountOnSide: number
  ): number {
    if (totalBetAmount === 0 || totalBetAmount < 100) {
      return currentOdds
    }

    const exposureRatio = betAmountOnSide / totalBetAmount

    // If more than 65% of money is on one side, make odds less attractive
    if (exposureRatio > 0.65) {
      const adjustment = (exposureRatio - 0.65) * 0.6 // Up to 21% reduction
      const adjustmentFactor = 1 - adjustment

      // Make odds less favorable
      if (currentOdds > 0) {
        return Math.round(currentOdds * adjustmentFactor)
      } else {
        return Math.round(currentOdds / adjustmentFactor)
      }
    } else if (exposureRatio < 0.35) {
      // Less than 35%, make odds more attractive
      const adjustment = (0.35 - exposureRatio) * 0.6 // Up to 21% increase
      const adjustmentFactor = 1 + adjustment

      if (currentOdds > 0) {
        return Math.round(currentOdds * adjustmentFactor)
      } else {
        return Math.round(currentOdds / adjustmentFactor)
      }
    }

    return currentOdds
  }

  /**
   * Calculate potential payout from American odds
   * @param stake - Amount wagered
   * @param americanOdds - American odds (e.g., -150, +200)
   * @returns Total payout including stake
   */
  calculatePayout(stake: number, americanOdds: number): number {
    let profit: number

    if (americanOdds > 0) {
      // Positive odds: profit = stake * (odds / 100)
      profit = stake * (americanOdds / 100)
    } else {
      // Negative odds: profit = stake / (|odds| / 100)
      profit = stake / (Math.abs(americanOdds) / 100)
    }

    return stake + profit
  }

  /**
   * Calculate profit from a bet (payout minus stake)
   */
  calculateProfit(stake: number, americanOdds: number): number {
    return this.calculatePayout(stake, americanOdds) - stake
  }

  /**
   * Calculate implied probability from American odds
   * Does NOT include house edge - this is the "true" odds
   */
  oddsToImpliedProbability(americanOdds: number): number {
    if (americanOdds > 0) {
      return 100 / (americanOdds + 100)
    } else {
      return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100)
    }
  }

  /**
   * Calculate expected value for a bet
   * Positive EV = good bet, Negative EV = bad bet
   */
  calculateExpectedValue(
    stake: number,
    americanOdds: number,
    trueProbability: number
  ): number {
    const payout = this.calculatePayout(stake, americanOdds)
    const expectedWin = trueProbability * payout
    const expectedLoss = (1 - trueProbability) * stake
    return expectedWin - expectedLoss
  }
}
