'use client'

import { useState } from 'react'
import { TournamentPicker } from '@/components/active-matches/TournamentPicker'
import { SwipeBetFlow } from '@/components/active-matches/SwipeBetFlow'
import { api } from '@/lib/trpc/react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { type UpcomingTournament } from '@/types/matches'

export default function ActiveMatchesPage() {
  const [selectedTournament, setSelectedTournament] = useState<{
    id: string
    name: string
  } | null>(null)

  const { data, isLoading } = api.matches.available.useQuery(undefined, {
    staleTime: 60_000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    )
  }

  // Filter to active/featured tournaments that have matches
  const tournaments: UpcomingTournament[] = (data?.upcomingTournaments ?? []).filter(
    (t) => (t._count?.matches ?? 0) > 0
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Active Matches</h1>
        <p className="mt-2 text-zinc-400">
          Swipe through matches to place your bets — quick and easy
        </p>
      </div>

      {selectedTournament ? (
        <SwipeBetFlow
          tournamentId={selectedTournament.id}
          tournamentName={selectedTournament.name}
          onBack={() => setSelectedTournament(null)}
        />
      ) : (
        <TournamentPicker
          tournaments={tournaments}
          onSelect={(id, name) => setSelectedTournament({ id, name })}
        />
      )}
    </div>
  )
}
