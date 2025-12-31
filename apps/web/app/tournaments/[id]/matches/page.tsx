import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'
import { formatGameName, formatRelativeTime } from '@/lib/utils/format'
import { MatchDetailsDialog } from '@/components/matches/MatchDetailsDialog'

type TournamentMatch = Prisma.MatchGetPayload<{
  include: {
    player1: true
    player2: true
    tournament: true
    _count: { select: { bets: true } }
  }
}>

export default async function PublicTournamentMatchesPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id: tournamentId } = await props.params

  if (!tournamentId) {
    return notFound()
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  })

  if (!tournament) {
    return notFound()
  }

  const matches: TournamentMatch[] = await prisma.match.findMany({
    where: { tournamentId },
    include: {
      player1: true,
      player2: true,
      tournament: true,
      _count: { select: { bets: true } },
    },
    orderBy: [{ scheduledStart: 'asc' }],
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600">Tournament Matches</p>
          <h1 className="text-3xl font-bold text-slate-900">{tournament.name}</h1>
          <div className="mt-1 text-sm text-slate-600">
            {formatGameName(tournament.game)} • {formatRelativeTime(tournament.startDate)}
            {tournament.location ? ` • ${tournament.location}` : ''}
          </div>
        </div>
        <Link
          href="/tournaments"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          ← Back to tournaments
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Matches ({matches.length})
          </h2>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Match
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Bets
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {matches.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  No matches found for this tournament.
                </td>
              </tr>
            ) : (
              matches.map((match) => (
                <tr key={match.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <MatchDetailsDialog
                      match={match}
                      trigger={
                        <button className="text-left">
                          <div className="text-sm font-medium text-slate-900 underline decoration-dotted hover:text-indigo-600">
                            {match.player1.gamerTag} vs {match.player2.gamerTag}
                          </div>
                          <div className="text-sm text-slate-600">
                            {match.round} • Best of {match.bestOf}
                          </div>
                        </button>
                      }
                    />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-slate-700">
                      {formatRelativeTime(match.scheduledStart)}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        match.status === 'LIVE'
                          ? 'bg-red-100 text-red-700'
                          : match.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700'
                          : match.status === 'CANCELLED'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {match.status}
                    </span>
                    {match.bettingOpen && (
                      <span className="ml-2 inline-flex rounded-full bg-emerald-100 px-2 text-xs font-semibold leading-5 text-emerald-700">
                        Betting Open
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                    {match._count.bets}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <div className="flex items-center gap-3">
                      <MatchDetailsDialog
                        match={match}
                        trigger={
                          <button className="text-indigo-600 hover:text-indigo-500 underline decoration-dotted">
                            Details
                          </button>
                        }
                      />
                      <Link
                        href={`/matches/${match.id}`}
                        className="text-slate-700 hover:text-slate-900"
                      >
                        View match page
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
