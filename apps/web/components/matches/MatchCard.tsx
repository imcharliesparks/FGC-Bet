'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { useState } from 'react'
import { useMatchOdds } from '@/hooks/useMatchOdds'
import { api } from '@/lib/trpc/react'
import { MobileBetSlip } from '@/components/betting/MobileBetSlip'

interface MatchCardProps {
  match: any
}

export function MatchCard({ match }: MatchCardProps) {
  const isLive = match.status === 'LIVE'
  const isUpcoming = match.status === 'SCHEDULED'

  const [betSlipOpen, setBetSlipOpen] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<
    'PLAYER_1' | 'PLAYER_2' | null
  >(null)

  const { odds, isLoading: oddsLoading } = useMatchOdds(match.id)
  const { data: wallet } = api.wallet.balance.useQuery()
  const utils = api.useUtils()

  const placeBet = api.bets.place.useMutation({
    onSuccess: () => {
      utils.matches.invalidate()
      utils.wallet.invalidate()
      setBetSlipOpen(false)
    },
  })

  const openBetSlip = (
    player: 'PLAYER_1' | 'PLAYER_2',
    e: React.MouseEvent
  ) => {
    e.preventDefault()
    e.stopPropagation()
    if (!match.bettingOpen) return
    setSelectedPlayer(player)
    setBetSlipOpen(true)
  }

  const handlePlaceBet = async (amount: number) => {
    if (!selectedPlayer) return
    await placeBet.mutateAsync({
      matchId: match.id,
      betType: 'MONEYLINE',
      selection: selectedPlayer,
      amount,
    })
  }

  return (
    <>
      <Link href={`/matches/${match.id}`}>
        <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 touch-manipulation active:scale-98">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-600">
            {match.game}
          </span>
          {isLive && (
            <span className="flex items-center gap-1 text-xs font-bold text-red-600">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              LIVE
            </span>
          )}
          {isUpcoming && match.bettingOpen && (
            <span className="text-xs font-medium text-green-600">
              Betting Open
            </span>
          )}
        </div>

        {/* Players */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img
                src={match.player1.imageUrl || '/default-player.png'}
                alt={match.player1.gamerTag}
                className="w-12 h-12 rounded-full flex-shrink-0 object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-base truncate">
                  {match.player1.gamerTag}
                </div>
                <div className="text-xs text-slate-500">
                  ELO: {match.player1.eloRating}
                </div>
              </div>
            </div>
            {isLive && (
              <div className="text-2xl font-bold ml-2 flex-shrink-0">
                {match.player1Score || 0}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center py-1">
            <span className="text-xs font-medium text-slate-400">VS</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img
                src={match.player2.imageUrl || '/default-player.png'}
                alt={match.player2.gamerTag}
                className="w-12 h-12 rounded-full flex-shrink-0 object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-base truncate">
                  {match.player2.gamerTag}
                </div>
                <div className="text-xs text-slate-500">
                  ELO: {match.player2.eloRating}
                </div>
              </div>
            </div>
            {isLive && (
              <div className="text-2xl font-bold ml-2 flex-shrink-0">
                {match.player2Score || 0}
              </div>
            )}
          </div>
        </div>

        {/* Betting Odds Section */}
        {match.bettingOpen && !oddsLoading && odds && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="text-xs font-semibold uppercase text-slate-500 mb-2">
              Betting Odds
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={(e) => openBetSlip('PLAYER_1', e)}
                className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-2 transition-colors"
              >
                <div className="text-xs text-slate-600">
                  {match.player1.gamerTag}
                </div>
                <div className="text-lg font-bold text-blue-600">
                  {odds.player1Odds > 0 ? '+' : ''}
                  {odds.player1Odds}
                </div>
              </button>
              <button
                onClick={(e) => openBetSlip('PLAYER_2', e)}
                className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-2 transition-colors"
              >
                <div className="text-xs text-slate-600">
                  {match.player2.gamerTag}
                </div>
                <div className="text-lg font-bold text-blue-600">
                  {odds.player2Odds > 0 ? '+' : ''}
                  {odds.player2Odds}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Time and Tournament */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="truncate flex-1">
              {match.tournament?.name || 'Tournament'}
            </span>
            <span className="ml-2 flex-shrink-0">
              {format(new Date(match.scheduledStart), 'MMM d, h:mm a')}
            </span>
          </div>
          {match.round && (
            <div className="text-xs text-slate-500 mt-1">{match.round}</div>
          )}
        </div>
      </div>
    </Link>

      {/* MobileBetSlip */}
      {betSlipOpen && selectedPlayer && odds && (
        <MobileBetSlip
          matchId={match.id}
          selection={selectedPlayer}
          playerName={
            selectedPlayer === 'PLAYER_1'
              ? match.player1.gamerTag
              : match.player2.gamerTag
          }
          odds={
            selectedPlayer === 'PLAYER_1' ? odds.player1Odds : odds.player2Odds
          }
          userBalance={wallet?.balance ?? 0}
          onPlaceBet={handlePlaceBet}
          onClose={() => setBetSlipOpen(false)}
        />
      )}
    </>
  )
}
