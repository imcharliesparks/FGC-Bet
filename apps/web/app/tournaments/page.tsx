import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'
import { formatGameName, formatRelativeTime } from '@/lib/utils/format'

type PublicTournament = Prisma.TournamentGetPayload<{
  include: {
    _count: { select: { matches: true } }
  }
}>

export default async function TournamentsPage() {
  const tournaments: PublicTournament[] = await prisma.tournament.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { matches: true } },
    },
    orderBy: { startDate: 'desc' },
    take: 50,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Tournaments</h1>
        <p className="mt-2 text-slate-600">
          Browse imported fighting game tournaments and jump into their matches.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Active Tournaments ({tournaments.length})
          </h2>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tournament
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Game
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Matches
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                View
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {tournaments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  No tournaments found.
                </td>
              </tr>
            ) : (
              tournaments.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">
                      {t.name}
                    </div>
                    {t.startGgId && (
                      <div className="text-xs text-slate-500">
                        start.gg ID: {t.startGgId}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700">
                      {formatGameName(t.game)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700">
                      {formatRelativeTime(t.startDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700">
                      {t.location || 'TBD'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {t._count.matches}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <Link
                      href={`/tournaments/${t.id}/matches`}
                      className="text-indigo-600 hover:text-indigo-500"
                    >
                      View matches
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
