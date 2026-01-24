import { type FightingGame, type MatchStatus } from '@repo/database'

export interface Player {
  id: string
  gamerTag: string
  eloRating: number
  imageUrl?: string | null
  country?: string | null
  startGgId?: string | null
}

export interface Tournament {
  id: string
  name: string
  slug: string
  imageUrl?: string | null
  location?: string | null
}

export interface FullMatch {
  id: string
  status: MatchStatus
  game: FightingGame
  round: string
  player1Id: string
  player2Id: string
  player1: Player
  player2: Player
  tournamentId: string
  tournament: Tournament
  player1Score: number | null
  player2Score: number | null
  bettingOpen: boolean
  scheduledStart: string | Date
  actualStart: string | Date | null
  completedAt: string | Date | null
  startGgId?: string | null
  bestOf?: number | null
  streamUrl?: string | null
  vodUrl?: string | null
  _count?: {
    bets: number
  }
}

export interface UpcomingTournament {
  id: string
  name: string
  slug: string
  game: FightingGame
  startDate: string | Date
  endDate: string | Date | null
  location?: string | null
  imageUrl?: string | null
  isFeatured?: boolean
  _count?: {
    matches: number
  }
}
