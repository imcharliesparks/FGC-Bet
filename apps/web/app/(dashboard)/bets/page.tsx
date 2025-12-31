import { requirePageAuth } from '@/lib/auth/helpers'
import { prisma } from '@/lib/db/prisma'
import { formatChips, formatRelativeTime } from '@/lib/utils/format'
import type { BetWithRelations } from '@/types'

export default async function BetsPage() {
  const user = await requirePageAuth()

  const [activeBets, completedBets]: [BetWithRelations[], BetWithRelations[]] = await Promise.all([
    prisma.bet.findMany({
      where: {
        userId: user.id,
        status: 'PENDING',
      },
      include: {
        match: {
          include: {
            player1: true,
            player2: true,
            tournament: true,
          },
        },
      },
      orderBy: {
        placedAt: 'desc',
      },
    }),
    prisma.bet.findMany({
      where: {
        userId: user.id,
        status: {
          in: ['WON', 'LOST'],
        },
      },
      include: {
        match: {
          include: {
            player1: true,
            player2: true,
            tournament: true,
          },
        },
      },
      orderBy: {
        placedAt: 'desc',
      },
      take: 20,
    }),
  ])

  return (
    <div className="space-y-8 text-zinc-50">
      <div>
        <h1 className="text-3xl font-bold text-white">My Bets</h1>
        <p className="mt-2 text-zinc-400">Track your active and past bets</p>
      </div>

      {/* Active Bets */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 shadow-xl shadow-black/20">
        <div className="border-b border-zinc-800 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">
            Active Bets ({activeBets.length})
          </h2>
        </div>
        <div className="p-6">
          {activeBets.length === 0 ? (
            <p className="py-8 text-center text-zinc-400">No active bets</p>
          ) : (
            <div className="space-y-4">
              {activeBets.map((bet) => (
                <div
                  key={bet.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-white">
                        {bet.match.player1.gamerTag} vs {bet.match.player2.gamerTag}
                      </div>
                      <div className="mt-1 text-sm text-zinc-400">
                        {bet.match.tournament.name} • {bet.selection}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        Placed {formatRelativeTime(bet.placedAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-zinc-50">
                        {formatChips(Number(bet.amount))} chips
                      </div>
                      <div className="text-sm text-zinc-400">
                        Odds: {Number(bet.odds) > 0 ? '+' : ''}
                        {Number(bet.odds)}
                      </div>
                      <div className="mt-1 text-sm text-green-300">
                        To win: {formatChips(Number(bet.potentialPayout))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-zinc-800 pt-3">
                    <span className="rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-100">
                      {bet.match.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bet History */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 shadow-xl shadow-black/20">
        <div className="border-b border-zinc-800 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Recent History</h2>
        </div>
        <div className="p-6">
          {completedBets.length === 0 ? (
            <p className="py-8 text-center text-zinc-400">No bet history yet</p>
          ) : (
            <div className="space-y-4">
              {completedBets.map((bet) => (
                <div
                  key={bet.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-white">
                        {bet.match.player1.gamerTag} vs {bet.match.player2.gamerTag}
                      </div>
                      <div className="mt-1 text-sm text-zinc-400">
                        {bet.match.tournament.name} • {bet.selection}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {formatRelativeTime(bet.placedAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-zinc-50">
                        {formatChips(Number(bet.amount))} chips
                      </div>
                      {bet.status === 'WON' ? (
                        <div className="mt-1 text-sm font-medium text-green-300">
                          Won: {formatChips(Number(bet.actualPayout || 0))}
                        </div>
                      ) : (
                        <div className="mt-1 text-sm font-medium text-red-300">
                          Lost
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 border-t border-zinc-800 pt-3">
                    <span
                      className={`px-2 py-1 text-xs font-semibold uppercase tracking-wide rounded-full ${
                        bet.status === 'WON'
                          ? 'bg-green-500/20 text-green-200'
                          : 'bg-red-500/20 text-red-200'
                      }`}
                    >
                      {bet.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
