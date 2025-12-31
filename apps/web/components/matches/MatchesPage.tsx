'use client'

import { useEffect, useState } from 'react'
import { LiveMatchCard } from './LiveMatchCard'
import { useRealtimeEvents } from '@/hooks/useRealtimeEvents'
import { formatGameName, formatRelativeTime } from '@/lib/utils/format'

interface UpcomingTournament {
  id: string
  name: string
  slug: string
  game: string
  startDate: string | Date
  endDate: string | Date | null
  location?: string | null
  imageUrl?: string | null
  isFeatured?: boolean
  _count?: {
    matches: number
  }
}

interface MatchesPageProps {
  initialMatches: any[]
  upcomingTournaments?: UpcomingTournament[]
}

export function MatchesPage({
  initialMatches,
  upcomingTournaments = [],
}: MatchesPageProps) {
  const [matches, setMatches] = useState(initialMatches)
  const { lastEvent } = useRealtimeEvents('match:all')

  useEffect(() => {
    if (lastEvent && lastEvent.type === 'match:update') {
      const { matchId, ...update } = lastEvent.data

      setMatches((prev) =>
        prev.map((match) =>
          match.id === matchId ? { ...match, ...update } : match
        )
      )
    }
  }, [lastEvent])

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No matches available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {upcomingTournaments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Upcoming Tournaments
              </h2>
              <p className="text-sm text-slate-600">
                Fighting games only, pulled from start.gg imports
              </p>
            </div>
            <span className="text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1">
              Live in {upcomingTournaments.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingTournaments.map((tournament) => {
              const startsAt = new Date(tournament.startDate)
              return (
                <div
                  key={tournament.id}
                  className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-slate-100">
                    {tournament.imageUrl ? (
                      <img
                        src={tournament.imageUrl}
                        alt={tournament.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-indigo-700">
                        {formatGameName(tournament.game)}
                      </span>
                      {tournament.isFeatured && (
                        <span className="text-[10px] font-semibold uppercase text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold text-slate-900">
                      {tournament.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      Starts {formatRelativeTime(startsAt)}
                      {tournament.location && ` | ${tournament.location}`}
                    </div>
                    {tournament._count?.matches ? (
                      <div className="mt-1 text-[11px] text-slate-500">
                        {tournament._count.matches} imported match
                        {tournament._count.matches === 1 ? '' : 'es'}
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map((match) => (
          <LiveMatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  )
}
