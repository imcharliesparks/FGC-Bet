import { requireAuth } from '@/lib/auth/helpers'
import { prisma } from '@/lib/db/prisma'
import { formatChips, formatRelativeTime } from '@/lib/utils/format'

export default async function BetsPage() {
  const user = await requireAuth()

  const [activeBets, completedBets] = await Promise.all([
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Bets</h1>
        <p className="mt-2 text-slate-600">Track your active and past bets</p>
      </div>

      {/* Active Bets */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            Active Bets ({activeBets.length})
          </h2>
        </div>
        <div className="p-6">
          {activeBets.length === 0 ? (
            <p className="text-center py-8 text-slate-600">No active bets</p>
          ) : (
            <div className="space-y-4">
              {activeBets.map((bet) => (
                <div
                  key={bet.id}
                  className="border border-slate-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-slate-900">
                        {bet.match.player1.gamerTag} vs {bet.match.player2.gamerTag}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        {bet.match.tournament.name} • {bet.selection}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Placed {formatRelativeTime(bet.placedAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-slate-900">
                        {formatChips(Number(bet.amount))} chips
                      </div>
                      <div className="text-sm text-slate-600">
                        Odds: {Number(bet.odds) > 0 ? '+' : ''}
                        {Number(bet.odds)}
                      </div>
                      <div className="text-sm text-green-600 mt-1">
                        To win: {formatChips(Number(bet.potentialPayout))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
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
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            Recent History
          </h2>
        </div>
        <div className="p-6">
          {completedBets.length === 0 ? (
            <p className="text-center py-8 text-slate-600">No bet history yet</p>
          ) : (
            <div className="space-y-4">
              {completedBets.map((bet) => (
                <div
                  key={bet.id}
                  className="border border-slate-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-slate-900">
                        {bet.match.player1.gamerTag} vs {bet.match.player2.gamerTag}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        {bet.match.tournament.name} • {bet.selection}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {formatRelativeTime(bet.placedAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-slate-900">
                        {formatChips(Number(bet.amount))} chips
                      </div>
                      {bet.status === 'WON' ? (
                        <div className="text-sm text-green-600 font-medium mt-1">
                          Won: {formatChips(Number(bet.actualPayout || 0))}
                        </div>
                      ) : (
                        <div className="text-sm text-red-600 font-medium mt-1">
                          Lost
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        bet.status === 'WON'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
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
