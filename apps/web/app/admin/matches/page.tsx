import { prisma } from '@/lib/db/prisma'
import { formatRelativeTime, formatGameName } from '@/lib/utils/format'
import Link from 'next/link'

export default async function AdminMatchesPage() {
  const matches = await prisma.match.findMany({
    include: {
      player1: true,
      player2: true,
      tournament: true,
      _count: {
        select: { bets: true },
      },
    },
    orderBy: {
      scheduledStart: 'desc',
    },
    take: 50,
  })

  return (
    <div className="space-y-6 text-zinc-50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Match Management</h1>
          <p className="mt-2 text-zinc-400">
            Create and manage betting matches
          </p>
        </div>
        <Link
          href="/admin/matches/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500"
        >
          Create Match
        </Link>
      </div>

      {/* Matches Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/80 shadow-xl shadow-black/20">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-900/80">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Match
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Tournament
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Game
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
                <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                  No matches found. Create your first match to get started.
                </td>
              </tr>
            ) : (
              matches.map((match) => (
                <tr key={match.id} className="hover:bg-zinc-900/60">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-white">
                      {match.player1.gamerTag} vs {match.player2.gamerTag}
                    </div>
                    <div className="text-sm text-zinc-500">
                      {match.round} • Best of {match.bestOf}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-zinc-200">
                      {match.tournament.name}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-zinc-200">
                      {formatGameName(match.game)}
                    </div>
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
                    <Link
                      href={`/admin/matches/${match.id}`}
                      className="text-indigo-300 hover:text-indigo-200"
                    >
                      Edit
                    </Link>
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
