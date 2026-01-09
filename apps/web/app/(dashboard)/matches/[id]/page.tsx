import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { MatchDetailClient } from '@/components/matches/MatchDetailClient'

export default async function MatchDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      player1: true,
      player2: true,
      tournament: true,
      _count: { select: { bets: true } },
    },
  })

  if (!match) {
    notFound()
  }

  return <MatchDetailClient initialMatch={match} />
}
