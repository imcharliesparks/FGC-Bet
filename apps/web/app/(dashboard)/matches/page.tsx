import { prisma } from '@/lib/db/prisma'
import { MatchesPage } from '@/components/matches/MatchesPage'

export default async function MatchesPageRoute() {
  const now = new Date()

  // Get all matches with betting open or currently live (fighting games only)
  const matches = await prisma.match.findMany({
    where: {
      game: { not: 'OTHER' },
      OR: [{ bettingOpen: true }, { status: 'LIVE' }],
    },
    include: {
      player1: true,
      player2: true,
      tournament: true,
    },
    orderBy: {
      scheduledStart: 'asc',
    },
    take: 50,
  })

  const upcomingTournaments = await prisma.tournament.findMany({
    where: {
      isActive: true,
      game: { not: 'OTHER' },
      startDate: { gte: now },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      game: true,
      startDate: true,
      endDate: true,
      location: true,
      imageUrl: true,
      isFeatured: true,
      _count: { select: { matches: true } },
    },
    orderBy: { startDate: 'asc' },
    take: 6,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Available Matches</h1>
        <p className="mt-2 text-slate-600">
          Place bets on upcoming and live fighting game matches
        </p>
      </div>

      <MatchesPage
        initialMatches={matches}
        upcomingTournaments={upcomingTournaments}
      />
    </div>
  )
}
