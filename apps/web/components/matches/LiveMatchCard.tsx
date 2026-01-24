'use client'

import { useEffect, useState } from 'react'
import { useMatchUpdates } from '@/hooks/useMatchUpdates'
import { formatGameName, formatRelativeTime } from '@/lib/utils/format'
import { MatchDetailsDialog } from './MatchDetailsDialog'
import { useMatchOdds } from '@/hooks/useMatchOdds'
import { api } from '@/lib/trpc/react'
import { MobileBetSlip } from '@/components/betting/MobileBetSlip'

interface LiveMatchCardProps {
  match: any
}

export function LiveMatchCard({ match: initialMatch }: LiveMatchCardProps) {
  const [match, setMatch] = useState(initialMatch)
  const { isConnected, matchUpdate, oddsUpdate } = useMatchUpdates(match.id)

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

  // Update match data when real-time updates arrive
  useEffect(() => {
    if (matchUpdate) {
      setMatch((prev: any) => ({ ...prev, ...matchUpdate }))
    }
  }, [matchUpdate])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE':
        return 'bg-red-500'
      case 'COMPLETED':
        return 'bg-green-500'
      case 'SCHEDULED':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <>
      <MatchDetailsDialog
        match={match}
        trigger={
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
          {/* Connection Status */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                }`}
              />
              <span className="text-xs text-gray-500">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-white text-xs font-medium ${getStatusColor(
                match.status
              )}`}
            >
              {match.status}
            </span>
          </div>

          {/* Tournament Info */}
          <div className="text-sm text-gray-600 mb-2">
            <a
              href={`/tournaments/${match.tournament.id}/matches`}
              className="hover:underline hover:text-indigo-600"
              onClick={(e) => e.stopPropagation()}
            >
              {match.tournament.name}
            </a>
          </div>
          <div className="text-xs text-gray-500 mb-4">
            {formatGameName(match.game)} • {match.round}
          </div>

          {/* Players */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 text-center">
              <div className="font-semibold text-lg">{match.player1.gamerTag}</div>
              <div className="text-sm text-gray-600">ELO: {match.player1.eloRating}</div>
              {match.status === 'LIVE' && match.player1Score !== null && (
                <div className="text-2xl font-bold text-blue-600 mt-2">
                  {match.player1Score}
                </div>
              )}
            </div>

            <div className="px-4 text-gray-400">vs</div>

            <div className="flex-1 text-center">
              <div className="font-semibold text-lg">{match.player2.gamerTag}</div>
              <div className="text-sm text-gray-600">ELO: {match.player2.eloRating}</div>
              {match.status === 'LIVE' && match.player2Score !== null && (
                <div className="text-2xl font-bold text-blue-600 mt-2">
                  {match.player2Score}
                </div>
              )}
            </div>
          </div>

          {/* Betting Odds Section */}
          {match.bettingOpen && !oddsLoading && odds && (
            <div className="mb-4">
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

          {/* Betting Status */}
          {match.bettingOpen ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="text-sm font-medium text-green-800">Betting Open</div>
              {oddsUpdate && (
                <div className="text-xs text-green-600 mt-1">
                  Odds updated {new Date(oddsUpdate.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <div className="text-sm font-medium text-gray-600">Betting Closed</div>
            </div>
          )}

          {/* Match Time */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            {match.status === 'SCHEDULED' &&
              `Starts ${formatRelativeTime(new Date(match.scheduledStart))}`}
            {match.status === 'LIVE' && match.actualStart &&
              `Started ${formatRelativeTime(new Date(match.actualStart))}`}
            {match.status === 'COMPLETED' && match.completedAt &&
              `Completed ${formatRelativeTime(new Date(match.completedAt))}`}
          </div>
        </div>
      }
    />

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
