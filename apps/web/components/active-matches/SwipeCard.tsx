'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import { type FullMatch } from '@/types/matches'
import { useMatchOdds } from '@/hooks/useMatchOdds'
import { formatGameName } from '@/lib/utils/format'

interface SwipeCardProps {
  match: FullMatch
  isTop: boolean
  onSwipe: (direction: 'left' | 'right' | 'down') => void
}

const SWIPE_THRESHOLD = 100
const ROTATION_FACTOR = 0.12

export function SwipeCard({ match, isTop, onSwipe }: SwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [exiting, setExiting] = useState<'left' | 'right' | 'down' | null>(null)

  const { odds } = useMatchOdds(match.id)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isTop) return
      setDragging(true)
      setStartPos({ x: e.clientX, y: e.clientY })
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [isTop]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return
      setOffset({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y,
      })
    },
    [dragging, startPos]
  )

  const handlePointerUp = useCallback(() => {
    if (!dragging) return
    setDragging(false)

    const absX = Math.abs(offset.x)
    const absY = offset.y // positive = downward

    if (absX > SWIPE_THRESHOLD && absX > Math.abs(offset.y)) {
      const dir = offset.x > 0 ? 'right' : 'left'
      setExiting(dir)
    } else if (absY > SWIPE_THRESHOLD && absY > absX) {
      setExiting('down')
    } else {
      // Snap back
      setOffset({ x: 0, y: 0 })
    }
  }, [dragging, offset])

  // After exit animation completes, fire the callback
  useEffect(() => {
    if (!exiting) return
    const timer = setTimeout(() => {
      onSwipe(exiting)
    }, 300)
    return () => clearTimeout(timer)
  }, [exiting, onSwipe])

  const rotation = dragging ? offset.x * ROTATION_FACTOR : 0
  const showPlayer1Glow = offset.x > 40
  const showPlayer2Glow = offset.x < -40
  const showSkipGlow = offset.y > 40 && Math.abs(offset.x) < 40

  const exitTransform = exiting
    ? exiting === 'left'
      ? 'translateX(-150%) rotate(-30deg)'
      : exiting === 'right'
        ? 'translateX(150%) rotate(30deg)'
        : 'translateY(150%)'
    : undefined

  const cardStyle: React.CSSProperties = {
    transform: exiting
      ? exitTransform
      : `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
    transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    opacity: exiting ? 0 : 1,
    zIndex: isTop ? 10 : 1,
    cursor: isTop ? 'grab' : 'default',
    touchAction: 'none',
  }

  return (
    <div
      ref={cardRef}
      className="absolute inset-0 select-none"
      style={cardStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        className={`relative h-full w-full rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-2xl overflow-hidden transition-shadow duration-200 ${
          showPlayer1Glow
            ? 'shadow-red-500/30 border-red-500/50'
            : showPlayer2Glow
              ? 'shadow-blue-500/30 border-blue-500/50'
              : showSkipGlow
                ? 'shadow-amber-500/30 border-amber-500/50'
                : ''
        }`}
      >
        {/* Direction labels */}
        {showPlayer1Glow && (
          <div className="absolute top-6 right-6 z-20 rounded-lg border-2 border-red-400 px-4 py-2 text-lg font-bold uppercase text-red-400 rotate-12">
            {match.player1.gamerTag}
          </div>
        )}
        {showPlayer2Glow && (
          <div className="absolute top-6 left-6 z-20 rounded-lg border-2 border-blue-400 px-4 py-2 text-lg font-bold uppercase text-blue-400 -rotate-12">
            {match.player2.gamerTag}
          </div>
        )}
        {showSkipGlow && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 rounded-lg border-2 border-amber-400 px-4 py-2 text-lg font-bold uppercase text-amber-400">
            Skip
          </div>
        )}

        {/* Header */}
        <div className="px-6 pt-6 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              {formatGameName(match.game)}
            </span>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
              Betting Open
            </span>
          </div>
          <div className="mt-1 text-sm text-zinc-500">
            {match.tournament?.name} • {match.round}
          </div>
        </div>

        {/* Players section */}
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-6 flex-1">
          {/* Player 1 */}
          <div className="flex w-full items-center gap-4 rounded-xl bg-zinc-800/60 p-4">
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-zinc-700 ring-2 ring-red-500/40">
              <Image
                src={match.player1.imageUrl || '/default-player.png'}
                alt={match.player1.gamerTag}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-lg font-bold text-white truncate">
                {match.player1.gamerTag}
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                {match.player1.country && <span>{match.player1.country}</span>}
                <span>•</span>
                <span>ELO {match.player1.eloRating}</span>
              </div>
            </div>
            {odds && (
              <div className="text-right">
                <div className="text-xs text-zinc-500">Odds</div>
                <div className="text-xl font-bold text-red-400">
                  {odds.player1Odds > 0 ? '+' : ''}
                  {odds.player1Odds}
                </div>
              </div>
            )}
          </div>

          {/* VS Divider */}
          <div className="flex items-center gap-3 w-full px-4">
            <div className="flex-1 h-px bg-zinc-700" />
            <span className="text-sm font-bold text-zinc-500 tracking-widest">VS</span>
            <div className="flex-1 h-px bg-zinc-700" />
          </div>

          {/* Player 2 */}
          <div className="flex w-full items-center gap-4 rounded-xl bg-zinc-800/60 p-4">
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-zinc-700 ring-2 ring-blue-500/40">
              <Image
                src={match.player2.imageUrl || '/default-player.png'}
                alt={match.player2.gamerTag}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-lg font-bold text-white truncate">
                {match.player2.gamerTag}
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                {match.player2.country && <span>{match.player2.country}</span>}
                <span>•</span>
                <span>ELO {match.player2.eloRating}</span>
              </div>
            </div>
            {odds && (
              <div className="text-right">
                <div className="text-xs text-zinc-500">Odds</div>
                <div className="text-xl font-bold text-blue-400">
                  {odds.player2Odds > 0 ? '+' : ''}
                  {odds.player2Odds}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2">
          <div className="text-center text-xs text-zinc-500 mb-3">
            Bo{match.bestOf || 3} • {format(new Date(match.scheduledStart), 'MMM d, h:mm a')}
          </div>
          <div className="flex items-center justify-center gap-6 text-xs text-zinc-600">
            <span className="flex items-center gap-1">
              <span className="text-blue-400">←</span> {match.player2.gamerTag}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-amber-400">↓</span> Skip
            </span>
            <span className="flex items-center gap-1">
              {match.player1.gamerTag} <span className="text-red-400">→</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
