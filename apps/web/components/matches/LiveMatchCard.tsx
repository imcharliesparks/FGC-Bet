'use client'

import { useEffect, useState } from 'react'
import { useMatchUpdates } from '@/hooks/useMatchUpdates'
import { formatGameName, formatRelativeTime } from '@/lib/utils/format'

interface LiveMatchCardProps {
  match: any
}

export function LiveMatchCard({ match: initialMatch }: LiveMatchCardProps) {
  const [match, setMatch] = useState(initialMatch)
  const { isConnected, matchUpdate, oddsUpdate } = useMatchUpdates(match.id)

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
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
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
        {match.tournament.name}
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

      {/* Betting Status */}
      {match.bettingOpen ? (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="text-sm font-medium text-green-800">
            Betting Open
          </div>
          {oddsUpdate && (
            <div className="text-xs text-green-600 mt-1">
              Odds updated {new Date(oddsUpdate.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <div className="text-sm font-medium text-gray-600">
            Betting Closed
          </div>
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
  )
}
