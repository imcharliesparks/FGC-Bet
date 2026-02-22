'use client'

import { useState, useCallback } from 'react'
import { SwipeDeck } from './SwipeDeck'
import { api } from '@/lib/trpc/react'
import { formatChips } from '@/lib/utils/format'
import { type FullMatch } from '@/types/matches'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface SwipeBetFlowProps {
  tournamentId: string
  tournamentName: string
  onBack: () => void
}

const QUICK_AMOUNTS = [100, 250, 500, 1000]

export function SwipeBetFlow({ tournamentId, tournamentName, onBack }: SwipeBetFlowProps) {
  const [betModal, setBetModal] = useState<{
    match: FullMatch
    selection: 'PLAYER_1' | 'PLAYER_2'
  } | null>(null)
  const [betAmount, setBetAmount] = useState(100)
  const [allDone, setAllDone] = useState(false)

  const { data: matches, isLoading } = api.matches.swipeable.useQuery(
    { tournamentId },
    { staleTime: 60_000 }
  )

  const { data: wallet } = api.wallet.balance.useQuery()
  const utils = api.useUtils()

  const placeBet = api.bets.place.useMutation({
    onSuccess: () => {
      utils.wallet.invalidate()
      utils.matches.invalidate()
      setBetModal(null)
      setBetAmount(100)
    },
  })

  const handleSelectPlayer = useCallback(
    (match: FullMatch, selection: 'PLAYER_1' | 'PLAYER_2') => {
      setBetModal({ match, selection })
    },
    []
  )

  const handlePlaceBet = async () => {
    if (!betModal) return
    await placeBet.mutateAsync({
      matchId: betModal.match.id,
      betType: 'MONEYLINE',
      selection: betModal.selection,
      amount: betAmount,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    )
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-white mb-2">All caught up!</h3>
        <p className="text-zinc-400 max-w-sm mb-6">
          No more bettable matches in {tournamentName}. Check back later!
        </p>
        <button
          onClick={onBack}
          className="rounded-lg bg-zinc-800 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          ← Back to tournaments
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">{tournamentName}</h2>
          <p className="text-sm text-zinc-400">Swipe to bet • {matches.length} matches available</p>
        </div>
      </div>

      {/* Swipe deck */}
      {!allDone && (
        <SwipeDeck
          matches={matches}
          onSelectPlayer={handleSelectPlayer}
          onEmpty={() => setAllDone(true)}
        />
      )}

      {allDone && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-white mb-2">All caught up!</h3>
          <p className="text-zinc-400 max-w-sm mb-6">
            You&apos;ve gone through all available matches. Check back later for more!
          </p>
          <button
            onClick={onBack}
            className="rounded-lg bg-zinc-800 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            ← Back to tournaments
          </button>
        </div>
      )}

      {/* Bet Confirmation Modal */}
      {betModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-zinc-900 border border-zinc-700/60 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Place Your Bet</h3>
              <button
                onClick={() => setBetModal(null)}
                className="rounded-full p-1 text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Selected player */}
            <div className="rounded-xl bg-zinc-800/60 p-4 mb-4">
              <div className="text-xs text-zinc-500 mb-1">Betting on</div>
              <div className="text-lg font-bold text-white">
                {betModal.selection === 'PLAYER_1'
                  ? betModal.match.player1.gamerTag
                  : betModal.match.player2.gamerTag}
              </div>
              <div className="text-sm text-zinc-400">
                {betModal.match.player1.gamerTag} vs {betModal.match.player2.gamerTag}
              </div>
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {QUICK_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  className={`rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                    betAmount === amount
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {formatChips(amount)}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="mb-4">
              <label className="block text-xs text-zinc-500 mb-1">Custom amount</label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
                min={1}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Balance info */}
            <div className="flex items-center justify-between text-sm text-zinc-400 mb-4">
              <span>Your balance</span>
              <span className="font-medium text-amber-400">
                💰 {formatChips(wallet?.balance ?? 0)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setBetModal(null)}
                className="flex-1 rounded-lg bg-zinc-800 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePlaceBet}
                disabled={
                  placeBet.isPending ||
                  betAmount <= 0 ||
                  betAmount > (wallet?.balance ?? 0)
                }
                className="flex-1 rounded-lg bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {placeBet.isPending ? 'Placing...' : `Bet ${formatChips(betAmount)} chips`}
              </button>
            </div>

            {placeBet.isError && (
              <p className="mt-3 text-sm text-red-400 text-center">
                {placeBet.error?.message || 'Failed to place bet'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
