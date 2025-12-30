import Redis from 'ioredis'

// Singleton pattern for Redis clients
let redisClient: Redis | null = null
let redisPubClient: Redis | null = null
let redisSubClient: Redis | null = null

/**
 * Check if Redis is enabled and properly configured
 */
function isRedisEnabled(): boolean {
  return (
    process.env.REDIS_ENABLED !== 'false' &&
    Boolean(process.env.REDIS_URL)
  )
}

/**
 * Get or create the main Redis client
 */
export function getRedisClient(): Redis | null {
  if (!isRedisEnabled()) {
    console.warn('Redis is disabled or not configured. Using in-memory fallback.')
    return null
  }

  if (!redisClient) {
    try {
      redisClient = new Redis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000)
          return delay
        },
      })

      redisClient.on('error', (err) => {
        console.error('Redis client error:', err)
      })

      redisClient.on('connect', () => {
        console.log('Redis client connected')
      })
    } catch (error) {
      console.error('Failed to create Redis client:', error)
      return null
    }
  }

  return redisClient
}

/**
 * Get or create the Redis publisher client
 */
export function getRedisPubClient(): Redis | null {
  if (!isRedisEnabled()) {
    return null
  }

  if (!redisPubClient) {
    const client = getRedisClient()
    if (client) {
      redisPubClient = client.duplicate()
    }
  }

  return redisPubClient
}

/**
 * Get or create the Redis subscriber client
 */
export function getRedisSubClient(): Redis | null {
  if (!isRedisEnabled()) {
    return null
  }

  if (!redisSubClient) {
    const client = getRedisClient()
    if (client) {
      redisSubClient = client.duplicate()
    }
  }

  return redisSubClient
}

/**
 * Close all Redis connections (for cleanup)
 */
export async function closeRedisConnections() {
  const clients = [redisClient, redisPubClient, redisSubClient].filter(Boolean)

  await Promise.all(
    clients.map((client) => {
      if (client) {
        return client.quit()
      }
    })
  )

  redisClient = null
  redisPubClient = null
  redisSubClient = null
}

// Export the main client as default
export const redis = getRedisClient()
