import { prisma } from '@/lib/db/prisma'
import { formatGameName, formatRelativeTime } from '@/lib/utils/format'
import Link from 'next/link'
import { ImportTournamentForm } from '@/components/admin/import-tournament-form'
import type { Prisma } from '@prisma/client'

type AdminTournament = Prisma.TournamentGetPayload<{
  include: {
    _count: {
      select: { matches: true }
    }
  }
}>

export default async function AdminTournamentsPage() {
  const tournaments: AdminTournament[] = await prisma.tournament.findMany({
    include: {
      _count: {
        select: { matches: true },
      },
    },
    orderBy: {
      startDate: 'desc',
    },
    take: 50,
  })

  return (
    <div className="space-y-6 text-zinc-50">
      <div>
        <h1 className="text-3xl font-bold text-white">Tournament Management</h1>
        <p className="mt-2 text-zinc-400">
          Import tournaments from start.gg or create them manually
        </p>
      </div>

      {/* Import Form */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl shadow-black/20">
        <h2 className="mb-4 text-xl font-semibold text-white">
          Import from start.gg
        </h2>
        <ImportTournamentForm />
      </div>

      {/* Tournaments Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/80 shadow-xl shadow-black/20">
        <div className="border-b border-zinc-800 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Tournaments</h2>
        </div>
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-900/80">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Tournament
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Game
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Matches
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-950/40">
            {tournaments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                  No tournaments found. Import your first tournament to get started.
                </td>
              </tr>
            ) : (
              tournaments.map((tournament) => (
                <tr key={tournament.id} className="hover:bg-zinc-900/60">
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/tournaments/${tournament.id}/matches`}
                      className="text-sm font-medium text-white underline decoration-dotted hover:text-indigo-200"
                    >
                      {tournament.name}
                    </Link>
                    {tournament.startGgId && (
                      <div className="text-xs text-zinc-500">
                        start.gg ID: {tournament.startGgId}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-zinc-200">
                      {formatGameName(tournament.game)}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-zinc-200">
                      {formatRelativeTime(tournament.startDate)}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-zinc-200">
                      {tournament.location || 'TBD'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-200">
                    {tournament._count.matches}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        tournament.isActive
                          ? tournament.isFeatured
                            ? 'bg-purple-500/20 text-purple-200'
                            : 'bg-green-500/20 text-green-200'
                          : 'bg-zinc-500/20 text-zinc-200'
                      }`}
                    >
                      {tournament.isFeatured ? 'Featured' : tournament.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <Link
                      href={`/admin/tournaments/${tournament.id}`}
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
