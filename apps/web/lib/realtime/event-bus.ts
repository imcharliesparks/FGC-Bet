import { getRedisPubClient, getRedisSubClient } from '../redis/client'

export type EventType =
  | 'match:update'
  | 'odds:update'
  | 'bet:placed'
  | 'match:settled'

export interface RealtimeEvent {
  type: EventType
  data: any
  timestamp: number
}

/**
 * In-memory event bus for when Redis is not available
 */
class InMemoryEventBus {
  private listeners: Map<string, Set<(event: RealtimeEvent) => void>> = new Map()

  subscribe(channel: string, callback: (event: RealtimeEvent) => void) {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set())
    }
    this.listeners.get(channel)!.add(callback)
  }

  unsubscribe(channel: string, callback: (event: RealtimeEvent) => void) {
    const channelListeners = this.listeners.get(channel)
    if (channelListeners) {
      channelListeners.delete(callback)
    }
  }

  publish(channel: string, event: RealtimeEvent) {
    const channelListeners = this.listeners.get(channel)
    if (channelListeners) {
      channelListeners.forEach((callback) => callback(event))
    }
  }
}

/**
 * Realtime Event Bus using Redis Pub/Sub
 * Falls back to in-memory if Redis is not available
 */
export class RealtimeEventBus {
  private pubClient = getRedisPubClient()
  private subClient = getRedisSubClient()
  private inMemoryBus = new InMemoryEventBus()
  private isRedisAvailable = Boolean(this.pubClient && this.subClient)

  constructor() {
    if (this.isRedisAvailable) {
      console.log('Using Redis for realtime events')
    } else {
      console.log('Using in-memory event bus (Redis not available)')
    }
  }

  /**
   * Subscribe to events on a channel
   */
  async subscribe(
    channel: string,
    callback: (event: RealtimeEvent) => void
  ): Promise<() => void> {
    if (this.isRedisAvailable && this.subClient) {
      // Redis subscription
      await this.subClient.subscribe(channel)

      const messageHandler = (ch: string, message: string) => {
        if (ch === channel) {
          try {
            const event: RealtimeEvent = JSON.parse(message)
            callback(event)
          } catch (error) {
            console.error('Error parsing Redis message:', error)
          }
        }
      }

      this.subClient.on('message', messageHandler)

      // Return unsubscribe function
      return async () => {
        await this.subClient!.unsubscribe(channel)
        this.subClient!.off('message', messageHandler)
      }
    } else {
      // In-memory subscription
      this.inMemoryBus.subscribe(channel, callback)

      // Return unsubscribe function
      return () => {
        this.inMemoryBus.unsubscribe(channel, callback)
      }
    }
  }

  /**
   * Publish an event to a channel
   */
  async publish(channel: string, type: EventType, data: any): Promise<void> {
    const event: RealtimeEvent = {
      type,
      data,
      timestamp: Date.now(),
    }

    if (this.isRedisAvailable && this.pubClient) {
      // Redis publish
      try {
        await this.pubClient.publish(channel, JSON.stringify(event))
      } catch (error) {
        console.error('Error publishing to Redis:', error)
        // Fallback to in-memory
        this.inMemoryBus.publish(channel, event)
      }
    } else {
      // In-memory publish
      this.inMemoryBus.publish(channel, event)
    }
  }

  /**
   * Publish match update
   */
  async publishMatchUpdate(matchId: string, update: any): Promise<void> {
    await this.publish(`match:${matchId}`, 'match:update', update)
    await this.publish('match:all', 'match:update', { matchId, ...update })
  }

  /**
   * Publish odds update
   */
  async publishOddsUpdate(matchId: string, odds: any): Promise<void> {
    await this.publish(`match:${matchId}`, 'odds:update', odds)
  }

  /**
   * Publish bet placed notification
   */
  async publishBetPlaced(userId: string, bet: any): Promise<void> {
    await this.publish(`user:${userId}`, 'bet:placed', bet)
  }

  /**
   * Publish match settled notification
   */
  async publishMatchSettled(matchId: string, settlement: any): Promise<void> {
    await this.publish(`match:${matchId}`, 'match:settled', settlement)
    await this.publish('match:all', 'match:settled', { matchId, ...settlement })
  }
}

// Singleton instance
let eventBus: RealtimeEventBus | null = null

export function getEventBus(): RealtimeEventBus {
  if (!eventBus) {
    eventBus = new RealtimeEventBus()
  }
  return eventBus
}
