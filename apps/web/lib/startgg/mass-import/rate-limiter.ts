import { STARTGG_RATE_LIMIT } from '../constants'

/**
 * Token bucket rate limiter for start.gg API
 * Allows up to 80 requests per 60 seconds
 */
export class RateLimiter {
  private tokens: number
  private lastRefill: number
  private readonly maxTokens: number
  private readonly refillInterval: number

  constructor() {
    this.maxTokens = STARTGG_RATE_LIMIT.MAX_REQUESTS
    this.refillInterval = STARTGG_RATE_LIMIT.WINDOW_MS
    this.tokens = this.maxTokens
    this.lastRefill = Date.now()
  }

  /**
   * Acquire a token, waiting if necessary
   */
  async acquire(): Promise<void> {
    this.refill()

    if (this.tokens <= 0) {
      const waitTime = this.refillInterval - (Date.now() - this.lastRefill)
      console.log(
        `[RateLimiter] Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s...`
      )
      await this.sleep(waitTime + 100)
      this.refill()
    }

    this.tokens--
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now()
    const elapsed = now - this.lastRefill

    if (elapsed >= this.refillInterval) {
      this.tokens = this.maxTokens
      this.lastRefill = now
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get current available tokens
   */
  getAvailableTokens(): number {
    this.refill()
    return this.tokens
  }

  /**
   * Get time until next refill
   */
  getTimeUntilRefill(): number {
    const elapsed = Date.now() - this.lastRefill
    return Math.max(0, this.refillInterval - elapsed)
  }
}
