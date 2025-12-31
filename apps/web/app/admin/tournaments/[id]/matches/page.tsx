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

export default async function TournamentMatchesPage(props: {
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
    orderBy: [{ scheduledStart: 'desc' }],
  })

  return (
    <div className="space-y-6 text-zinc-50">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">Tournament Matches</p>
          <h1 className="text-3xl font-bold text-white">{tournament.name}</h1>
          <div className="mt-1 text-sm text-zinc-400">
            {formatGameName(tournament.game)} • {formatRelativeTime(tournament.startDate)}
            {tournament.location ? ` • ${tournament.location}` : ''}
          </div>
        </div>
        <Link
          href="/admin/tournaments"
          className="text-sm font-medium text-indigo-300 hover:text-indigo-200"
        >
          ← Back to tournaments
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/80 shadow-xl shadow-black/20">
        <div className="border-b border-zinc-800 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">
            Matches ({matches.length})
          </h2>
        </div>
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-900/80">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Match
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Bets
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-950/40">
            {matches.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                  No matches found for this tournament.
                </td>
              </tr>
            ) : (
              matches.map((match) => (
                <tr key={match.id} className="hover:bg-zinc-900/60">
                  <td className="whitespace-nowrap px-6 py-4">
                    <MatchDetailsDialog
                      match={match}
                      trigger={
                        <button className="text-left">
                          <div className="text-sm font-medium text-white underline decoration-dotted hover:text-indigo-100">
                            {match.player1.gamerTag} vs {match.player2.gamerTag}
                          </div>
                          <div className="text-sm text-zinc-500">
                            {match.round} • Best of {match.bestOf}
                          </div>
                        </button>
                      }
                    />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-zinc-200">
                      {formatRelativeTime(match.scheduledStart)}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        match.status === 'LIVE'
                          ? 'bg-red-500/20 text-red-200'
                          : match.status === 'COMPLETED'
                          ? 'bg-green-500/20 text-green-200'
                          : match.status === 'CANCELLED'
                          ? 'bg-zinc-500/20 text-zinc-200'
                          : 'bg-blue-500/20 text-blue-200'
                      }`}
                    >
                      {match.status}
                    </span>
                    {match.bettingOpen && (
                      <span className="ml-2 inline-flex rounded-full bg-emerald-500/20 px-2 text-xs font-semibold leading-5 text-emerald-100">
                        Betting Open
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-200">
                    {match._count.bets}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <div className="flex items-center gap-3">
                      <MatchDetailsDialog
                        match={match}
                        trigger={
                          <button className="text-zinc-200 hover:text-white underline decoration-dotted">
                            Details
                          </button>
                        }
                      />
                      <Link
                        href={`/admin/matches/${match.id}`}
                        className="text-indigo-300 hover:text-indigo-200"
                      >
                        Edit
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
