import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/helpers'
import { MatchImporter } from '@/lib/startgg/import'

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const { tournamentSlug } = await request.json()

    if (!tournamentSlug) {
      return NextResponse.json(
        { error: 'Tournament slug required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.STARTGG_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'start.gg API key not configured. Please add STARTGG_API_KEY to .env' },
        { status: 500 }
      )
    }

    const importer = new MatchImporter(apiKey)
    const result = await importer.importTournament(tournamentSlug)

    return NextResponse.json({
      success: true,
      tournament: {
        id: result.tournament.id,
        name: result.tournament.name,
        slug: result.tournament.slug,
      },
      matchesImported: result.matchesImported,
    })
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error.message || 'Import failed' },
      { status: 500 }
    )
  }
}
