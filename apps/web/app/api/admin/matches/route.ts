import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/helpers'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { FightingGame } from '@repo/database'

const createMatchSchema = z.object({
  game: z.nativeEnum(FightingGame),
  tournamentId: z.string(),
  player1Id: z.string(),
  player2Id: z.string(),
  scheduledStart: z.string().datetime(),
  bestOf: z.number().int().min(1).max(7).default(3),
  round: z.string(),
  streamUrl: z.string().url().optional().nullable(),
  bettingOpen: z.boolean().default(true),
})

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const body = await request.json()
    const data = createMatchSchema.parse(body)

    const match = await prisma.match.create({
      data: {
        ...data,
        scheduledStart: new Date(data.scheduledStart),
        status: 'SCHEDULED',
      },
      include: {
        player1: true,
        player2: true,
        tournament: true,
      },
    })

    return NextResponse.json({ match })
  } catch (error: any) {
    console.error('Create match error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create match' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tournamentId = searchParams.get('tournamentId')
    const status = searchParams.get('status')

    const where: any = {}
    if (tournamentId) where.tournamentId = tournamentId
    if (status) where.status = status

    const matches = await prisma.match.findMany({
      where,
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
      take: 100,
    })

    return NextResponse.json({ matches })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}
