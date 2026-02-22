'use client'

import Image from 'next/image'
import { formatGameName, formatRelativeTime } from '@/lib/utils/format'
import { type UpcomingTournament } from '@/types/matches'

interface TournamentPickerProps {
  tournaments: UpcomingTournament[]
  onSelect: (tournamentId: string, tournamentName: string) => void
}

export function TournamentPicker({ tournaments, onSelect }: TournamentPickerProps) {
  if (tournaments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-2xl font-bold text-white mb-2">No active tournaments</h3>
        <p className="text-zinc-400 max-w-sm">
          There are no featured tournaments with open betting right now. Check back soon!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Pick a Tournament</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Choose a tournament to start swiping through matches
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tournaments.map((tournament) => {
          const startsAt = new Date(tournament.startDate)
          const matchCount = tournament._count?.matches ?? 0

          return (
            <button
              key={tournament.id}
              onClick={() => onSelect(tournament.id, tournament.name)}
              className="group flex gap-4 rounded-xl border border-zinc-700/60 bg-zinc-900 p-5 text-left shadow-lg hover:border-indigo-500/50 hover:bg-zinc-800/80 transition-all duration-200"
            >
              {/* Tournament image */}
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                {tournament.imageUrl ? (
                  <Image
                    src={tournament.imageUrl}
                    alt={tournament.name}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl">
                    🎮
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    {formatGameName(tournament.game)}
                  </span>
                  {tournament.isFeatured && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-400">
                      Featured
                    </span>
                  )}
                </div>
                <div className="text-base font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                  {tournament.name}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                  <span>Starts {formatRelativeTime(startsAt)}</span>
                  {tournament.location && (
                    <>
                      <span>•</span>
                      <span>{tournament.location}</span>
                    </>
                  )}
                </div>
                {matchCount > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {matchCount} match{matchCount !== 1 ? 'es' : ''} available
                  </div>
                )}
              </div>

              {/* Arrow */}
              <div className="flex items-center text-zinc-600 group-hover:text-indigo-400 transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
