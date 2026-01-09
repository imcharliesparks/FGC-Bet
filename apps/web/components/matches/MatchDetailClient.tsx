'use client'

import { format } from 'date-fns'
import { useBettingInterface } from '@/hooks/useBettingInterface'
import { MobileBetSlip } from '@/components/betting/MobileBetSlip'
import { useMatchUpdates } from '@/hooks/useMatchUpdates'

export function MatchDetailClient({ initialMatch }: { initialMatch: any }) {
  const {
    betSlipOpen,
    selectedPlayer,
    selectedPlayerName,
    selectedPlayerOdds,
    userBalance,
    match,
    odds,
    oddsLoading,
    openBetSlip,
    handlePlaceBet,
    closeBetSlip,
    canBet,
  } = useBettingInterface(initialMatch.id)

  const { matchUpdate, oddsUpdate } = useMatchUpdates(initialMatch.id)

  // Use real-time updates if available, otherwise use initial data
  const displayMatch = matchUpdate || match || initialMatch

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Match Details</h1>
          {displayMatch.status === 'LIVE' && (
            <span className="flex items-center gap-2 text-red-600 font-bold">
              <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
              LIVE
            </span>
          )}
          {displayMatch.bettingOpen && displayMatch.status === 'SCHEDULED' && (
            <span className="text-green-600 font-semibold">Betting Open</span>
          )}
        </div>

        {/* Tournament Info */}
        {displayMatch.tournament && (
          <div className="text-slate-600 mb-4">
            {displayMatch.tournament.name} • {displayMatch.round}
          </div>
        )}

        {/* Players - Large Display */}
        <div className="grid grid-cols-2 gap-8 my-8">
          <div className="text-center">
            <img
              src={displayMatch.player1.imageUrl || '/default-player.png'}
              alt={displayMatch.player1.gamerTag}
              className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
            />
            <h2 className="text-2xl font-bold mb-2">
              {displayMatch.player1.gamerTag}
            </h2>
            <div className="text-slate-600">
              ELO: {displayMatch.player1.eloRating}
            </div>
            {displayMatch.status === 'LIVE' && (
              <div className="text-4xl font-bold mt-2">
                {displayMatch.player1Score || 0}
              </div>
            )}
          </div>

          <div className="text-center">
            <img
              src={displayMatch.player2.imageUrl || '/default-player.png'}
              alt={displayMatch.player2.gamerTag}
              className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
            />
            <h2 className="text-2xl font-bold mb-2">
              {displayMatch.player2.gamerTag}
            </h2>
            <div className="text-slate-600">
              ELO: {displayMatch.player2.eloRating}
            </div>
            {displayMatch.status === 'LIVE' && (
              <div className="text-4xl font-bold mt-2">
                {displayMatch.player2Score || 0}
              </div>
            )}
          </div>
        </div>

        {/* Betting Section */}
        {canBet && odds && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Place Your Bet</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => openBetSlip('PLAYER_1')}
                className="bg-white border-2 border-blue-300 hover:border-blue-500 rounded-lg p-6 transition-all hover:shadow-lg"
              >
                <div className="font-medium mb-2">
                  {displayMatch.player1.gamerTag}
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {odds.player1Odds > 0 ? '+' : ''}
                  {odds.player1Odds}
                </div>
                <div className="text-sm text-slate-600 mt-2">Click to bet</div>
              </button>

              <button
                onClick={() => openBetSlip('PLAYER_2')}
                className="bg-white border-2 border-blue-300 hover:border-blue-500 rounded-lg p-6 transition-all hover:shadow-lg"
              >
                <div className="font-medium mb-2">
                  {displayMatch.player2.gamerTag}
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {odds.player2Odds > 0 ? '+' : ''}
                  {odds.player2Odds}
                </div>
                <div className="text-sm text-slate-600 mt-2">Click to bet</div>
              </button>
            </div>
          </div>
        )}

        {/* Match Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-600">Game:</span>{' '}
            <span className="font-medium">{displayMatch.game}</span>
          </div>
          <div>
            <span className="text-slate-600">Format:</span>{' '}
            <span className="font-medium">Best of {displayMatch.bestOf}</span>
          </div>
          <div>
            <span className="text-slate-600">Scheduled:</span>{' '}
            <span className="font-medium">
              {format(new Date(displayMatch.scheduledStart), 'PPP p')}
            </span>
          </div>
          {displayMatch._count && (
            <div>
              <span className="text-slate-600">Total Bets:</span>{' '}
              <span className="font-medium">{displayMatch._count.bets}</span>
            </div>
          )}
        </div>
      </div>

      {/* MobileBetSlip */}
      {betSlipOpen && selectedPlayer && selectedPlayerOdds && (
        <MobileBetSlip
          matchId={initialMatch.id}
          selection={selectedPlayer}
          playerName={selectedPlayerName || ''}
          odds={selectedPlayerOdds}
          userBalance={userBalance}
          onPlaceBet={handlePlaceBet}
          onClose={closeBetSlip}
        />
      )}
    </div>
  )
}
