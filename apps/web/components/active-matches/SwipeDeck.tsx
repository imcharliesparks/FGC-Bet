'use client'

import { useState, useCallback } from 'react'
import { SwipeCard } from './SwipeCard'
import { type FullMatch } from '@/types/matches'
import { api } from '@/lib/trpc/react'

interface SwipeDeckProps {
  matches: FullMatch[]
  onSelectPlayer: (match: FullMatch, selection: 'PLAYER_1' | 'PLAYER_2') => void
  onEmpty: () => void
}

export function SwipeDeck({ matches: initialMatches, onSelectPlayer, onEmpty }: SwipeDeckProps) {
  const [stack, setStack] = useState<FullMatch[]>(initialMatches)

  const skipMutation = api.matches.skip.useMutation()

  const handleSwipe = useCallback(
    (direction: 'left' | 'right' | 'down') => {
      const current = stack[0]
      if (!current) return

      if (direction === 'right') {
        onSelectPlayer(current, 'PLAYER_1')
      } else if (direction === 'left') {
        onSelectPlayer(current, 'PLAYER_2')
      } else {
        // Skip — record dismissal and remove from stack
        skipMutation.mutate({ matchId: current.id })
      }

      const next = stack.slice(1)
      setStack(next)

      if (next.length === 0) {
        onEmpty()
      }
    },
    [stack, onSelectPlayer, onEmpty, skipMutation]
  )

  if (stack.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-white mb-2">All caught up!</h3>
        <p className="text-zinc-400 max-w-sm">
          You&apos;ve seen all available matches for this tournament. Check back later for more!
        </p>
      </div>
    )
  }

  // Render up to 3 cards, top card on top
  const visible = stack.slice(0, 3)

  return (
    <div className="relative w-full max-w-md mx-auto" style={{ height: '560px' }}>
      {visible.map((match, index) => {
        const isTop = index === 0
        return (
          <div
            key={match.id}
            className="absolute inset-0"
            style={{
              transform: `scale(${1 - index * 0.04}) translateY(${index * 10}px)`,
              zIndex: visible.length - index,
            }}
          >
            <SwipeCard match={match} isTop={isTop} onSwipe={handleSwipe} />
          </div>
        )
      })}

      {/* Card count indicator */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
        <span className="text-sm text-zinc-500">
          {stack.length} match{stack.length !== 1 ? 'es' : ''} remaining
        </span>
      </div>
    </div>
  )
}
