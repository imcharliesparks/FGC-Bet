import { requireAuth } from '@/lib/auth/helpers'
import { prisma } from '@/lib/db/prisma'
import { formatChips, formatRelativeTime } from '@/lib/utils/format'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await requireAuth()

  // Get user's active bets
  const activeBets = await prisma.bet.findMany({
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
    take: 5,
  })

  // Get user stats
  const [totalBets, wonBets, lostBets] = await Promise.all([
    prisma.bet.count({ where: { userId: user.id } }),
    prisma.bet.count({ where: { userId: user.id, status: 'WON' } }),
    prisma.bet.count({ where: { userId: user.id, status: 'LOST' } }),
  ])

  const winRate = totalBets > 0 ? ((wonBets / totalBets) * 100).toFixed(1) : '0.0'

  // Get upcoming matches with betting open
  const upcomingMatches = await prisma.match.findMany({
    where: {
      status: 'SCHEDULED',
      bettingOpen: true,
      scheduledStart: {
        gte: new Date(),
      },
    },
    include: {
      player1: true,
      player2: true,
      tournament: true,
    },
    orderBy: {
      scheduledStart: 'asc',
    },
    take: 5,
  })

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {user.firstName || user.username}!
        </h1>
        <p className="mt-2 text-slate-600">
          Here's what's happening with your betting activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-slate-600">Chip Balance</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {formatChips(Number(user.chipBalance))}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-slate-600">Active Bets</div>
          <div className="mt-2 text-3xl font-bold text-blue-600">
            {activeBets.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-slate-600">Total Bets</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {totalBets}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-slate-600">Win Rate</div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            {winRate}%
          </div>
        </div>
      </div>

      {/* Active Bets */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Active Bets</h2>
        </div>
        <div className="p-6">
          {activeBets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600">No active bets</p>
              <Link
                href="/matches"
                className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
              >
                Browse matches →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeBets.map((bet) => (
                <div key={bet.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-slate-900">
                        {bet.match.player1.gamerTag} vs {bet.match.player2.gamerTag}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        {bet.match.tournament.name} • {bet.selection}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-slate-900">
                        {formatChips(Number(bet.amount))} chips
                      </div>
                      <div className="text-sm text-green-600">
                        Win: {formatChips(Number(bet.potentialPayout))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Matches */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Upcoming Matches</h2>
        </div>
        <div className="p-6">
          {upcomingMatches.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600">No upcoming matches available for betting</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingMatches.map((match) => (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="block border border-slate-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-slate-900">
                        {match.player1.gamerTag} vs {match.player2.gamerTag}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        {match.tournament.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-600">
                        {formatRelativeTime(match.scheduledStart)}
                      </div>
                      <div className="text-xs text-slate-500">
                        Best of {match.bestOf}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
