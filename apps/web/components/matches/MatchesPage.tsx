'use client'

import { useEffect, useState } from 'react'
import { LiveMatchCard } from './LiveMatchCard'
import { useRealtimeEvents } from '@/hooks/useRealtimeEvents'

interface MatchesPageProps {
  initialMatches: any[]
}

export function MatchesPage({ initialMatches }: MatchesPageProps) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {matches.map((match) => (
        <LiveMatchCard key={match.id} match={match} />
      ))}
    </div>
  )
}
