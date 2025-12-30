/**
 * Convert American odds to decimal odds
 * @param americanOdds - American odds (e.g., -150, +200)
 * @returns Decimal odds (e.g., 1.67, 3.00)
 */
export function americanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1
  } else {
    return (100 / Math.abs(americanOdds)) + 1
  }
}

/**
 * Convert decimal odds to American odds
 * @param decimalOdds - Decimal odds (e.g., 1.67, 3.00)
 * @returns American odds (e.g., -150, +200)
 */
export function decimalToAmerican(decimalOdds: number): number {
  if (decimalOdds >= 2) {
    return Math.round((decimalOdds - 1) * 100)
  } else {
    return Math.round(-100 / (decimalOdds - 1))
  }
}

/**
 * Calculate potential payout from a bet
 * @param stake - Amount wagered
 * @param americanOdds - American odds
 * @returns Total payout including stake
 */
export function calculatePayout(stake: number, americanOdds: number): number {
  const decimalOdds = americanToDecimal(americanOdds)
  return stake * decimalOdds
}

/**
 * Calculate profit from a bet (payout minus stake)
 * @param stake - Amount wagered
 * @param americanOdds - American odds
 * @returns Profit amount
 */
export function calculateProfit(stake: number, americanOdds: number): number {
  return calculatePayout(stake, americanOdds) - stake
}

/**
 * Calculate implied probability from American odds
 * @param americanOdds - American odds
 * @returns Probability as a decimal (0-1)
 */
export function impliedProbability(americanOdds: number): number {
  if (americanOdds > 0) {
    return 100 / (americanOdds + 100)
  } else {
    return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100)
  }
}

/**
 * Format American odds with + or - prefix
 * @param odds - American odds number
 * @returns Formatted string (e.g., "-150", "+200")
 */
export function formatAmericanOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`
}
