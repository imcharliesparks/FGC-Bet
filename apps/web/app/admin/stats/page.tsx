import { prisma } from '@/lib/db/prisma'
import { formatGameName } from '@/lib/utils/format'

export default async function AdminStatsPage() {
  const [tournaments, matches, bets, users, activeMatches] = await Promise.all([
    prisma.tournament.count(),
    prisma.match.count(),
    prisma.bet.count(),
    prisma.user.count(),
    prisma.match.count({ where: { status: 'LIVE' } }),
  ])

  const recentTournaments = await prisma.tournament.findMany({
    select: {
      id: true,
      name: true,
      game: true,
      startDate: true,
      _count: { select: { matches: true } },
    },
    orderBy: { startDate: 'desc' },
    take: 5,
  })

  const matchesByStatus = await prisma.match.groupBy({
    by: ['status'],
    _count: { _all: true },
  })

  const matchesByGame = await prisma.match.groupBy({
    by: ['game'],
    _count: { game: true },
    orderBy: { _count: { game: 'desc' } },
    take: 6,
  })

  return (
    <div className="space-y-8 text-zinc-50">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">Admin Overview</p>
          <h1 className="text-3xl font-bold text-white">Platform Stats</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Quick snapshot of tournaments, matches, bets, and users.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tournaments" value={tournaments} />
        <StatCard label="Matches" value={matches} />
        <StatCard label="Bets" value={bets} />
        <StatCard label="Users" value={users} />
        <StatCard label="Live Matches" value={activeMatches} accent />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
          <h2 className="text-lg font-semibold text-white">Recent Tournaments</h2>
          <div className="mt-3 space-y-3">
            {recentTournaments.length === 0 ? (
              <p className="text-sm text-zinc-500">No tournaments found.</p>
            ) : (
              recentTournaments.map((t) => (
                <div
                  key={t.id}
                  className="rounded-md border border-zinc-800 bg-zinc-950/40 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <a
                        href={`/tournaments/${t.id}/matches`}
                        className="text-sm font-semibold text-white hover:text-indigo-200 hover:underline"
                      >
                        {t.name}
                      </a>
                      <div className="text-xs text-zinc-500">
                        {formatGameName(t.game)} • {new Date(t.startDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-xs text-zinc-400">
                      {t._count.matches} matches
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
          <h2 className="text-lg font-semibold text-white">Matches by Status</h2>
          <div className="mt-3 space-y-2">
            {matchesByStatus.map((row) => (
              <div
                key={row.status}
                className="flex items-center justify-between rounded-md bg-zinc-950/40 px-3 py-2"
              >
                <span className="text-sm text-zinc-200">{row.status}</span>
                <span className="text-sm font-semibold text-white">{row._count._all}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
        <h2 className="text-lg font-semibold text-white">Matches by Game</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {matchesByGame.length === 0 ? (
            <p className="text-sm text-zinc-500">No matches found.</p>
          ) : (
            matchesByGame.map((row) => (
              <div
                key={row.game}
                className="rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-2"
              >
                <div className="text-sm font-semibold text-white">
                  {formatGameName(row.game)}
                </div>
                <div className="text-xs text-zinc-400">{row._count._all} matches</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-lg border ${
        accent ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-900/60'
      } p-4 shadow`}
    >
      <div className="text-xs font-semibold uppercase text-zinc-400">{label}</div>
      <div className="mt-2 text-2xl font-bold text-white">{value}</div>
    </div>
  )
}
