import { requirePageAuth } from '@/lib/auth/helpers'
import { prisma } from '@/lib/db/prisma'
import { formatChips, formatRelativeTime } from '@/lib/utils/format'
import Link from 'next/link'
import type { Prisma } from '@prisma/client'

type DashboardBet = Prisma.BetGetPayload<{
  include: {
    match: {
      include: {
        player1: true
        player2: true
        tournament: true
      }
    }
  }
}>

type UpcomingMatch = Prisma.MatchGetPayload<{
  include: {
    player1: true
    player2: true
    tournament: true
  }
}>

export default async function DashboardPage() {
  const user = await requirePageAuth()

  // Get user's active bets
  const activeBets: DashboardBet[] = await prisma.bet.findMany({
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
  const [totalBets, wonBets] = await Promise.all([
    prisma.bet.count({ where: { userId: user.id } }),
    prisma.bet.count({ where: { userId: user.id, status: 'WON' } }),
    prisma.bet.count({ where: { userId: user.id, status: 'LOST' } }),
  ])

  const winRate = totalBets > 0 ? ((wonBets / totalBets) * 100).toFixed(1) : '0.0'

  // Get upcoming matches with betting open
  const upcomingMatches: UpcomingMatch[] = await prisma.match.findMany({
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
    <div className="space-y-8 text-zinc-50">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {user.firstName || user.username}!
        </h1>
        <p className="mt-2 text-zinc-400">
          Here&apos;s what&apos;s happening with your betting activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6 shadow-lg shadow-black/20">
          <div className="text-sm font-medium text-zinc-400">Chip Balance</div>
          <div className="mt-2 text-3xl font-bold text-amber-200">
            {formatChips(Number(user.chipBalance))}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6 shadow-lg shadow-black/20">
          <div className="text-sm font-medium text-zinc-400">Active Bets</div>
          <div className="mt-2 text-3xl font-bold text-blue-300">
            {activeBets.length}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6 shadow-lg shadow-black/20">
          <div className="text-sm font-medium text-zinc-400">Total Bets</div>
          <div className="mt-2 text-3xl font-bold text-zinc-50">
            {totalBets}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6 shadow-lg shadow-black/20">
          <div className="text-sm font-medium text-zinc-400">Win Rate</div>
          <div className="mt-2 text-3xl font-bold text-green-300">
            {winRate}%
          </div>
        </div>
      </div>

      {/* Active Bets */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 shadow-xl shadow-black/20">
        <div className="border-b border-zinc-800 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Active Bets</h2>
        </div>
        <div className="p-6">
          {activeBets.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-zinc-400">No active bets</p>
              <Link
                href="/matches"
                className="mt-4 inline-block text-sm font-medium text-indigo-300 hover:text-indigo-200"
              >
                Browse matches →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeBets.map((bet: DashboardBet) => (
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

      {/* Upcoming Matches */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 shadow-xl shadow-black/20">
        <div className="border-b border-zinc-800 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Upcoming Matches</h2>
        </div>
        <div className="p-6">
          {upcomingMatches.length === 0 ? (
            <div className="py-12 text-center text-zinc-400">
              No upcoming matches available for betting
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingMatches.map((match) => (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="block rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 transition hover:border-indigo-300/60"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">
                        {match.player1.gamerTag} vs {match.player2.gamerTag}
                      </div>
                      <div className="mt-1 text-sm text-zinc-400">
                        {match.tournament.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-indigo-200">
                        {formatRelativeTime(match.scheduledStart)}
                      </div>
                      <div className="text-xs text-zinc-500">
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
