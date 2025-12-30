// Re-export Prisma types
export type {
  User,
  Tournament,
  Player,
  Match,
  OddsSnapshot,
  Bet,
  Transaction,
  FightingGame,
  MatchStatus,
  BetType,
  BetSelection,
  BetStatus,
  TransactionType,
} from '@repo/database'

// Extended types for API responses
export interface MatchWithDetails {
  id: string
  tournament: {
    id: string
    name: string
    game: string
  }
  player1: {
    id: string
    gamerTag: string
    imageUrl: string | null
  }
  player2: {
    id: string
    gamerTag: string
    imageUrl: string | null
  }
  status: string
  scheduledStart: Date
  bettingOpen: boolean
  currentOdds?: {
    player1Odds: number
    player2Odds: number
  }
}

export interface BetWithMatch {
  id: string
  amount: number
  odds: number
  potentialPayout: number
  status: string
  selection: string
  betType: string
  placedAt: Date
  match: {
    id: string
    player1: {
      gamerTag: string
    }
    player2: {
      gamerTag: string
    }
    status: string
  }
}

export interface UserStats {
  totalBets: number
  activeBets: number
  wonBets: number
  lostBets: number
  totalWagered: number
  totalWon: number
  netProfit: number
  winRate: number
}
