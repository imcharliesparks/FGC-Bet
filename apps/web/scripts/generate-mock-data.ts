import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { FightingGame, MatchStatus, BetType } from '@prisma/client'

// Data directories
const DATA_DIR = path.join(process.cwd(), 'data')
const MATCHES_FILE = path.join(DATA_DIR, 'mock-matches.json')

// Helper function to create directories
const ensureDirectoryExists = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

// Generate an ISO string for future dates
const futureDateString = (daysAhead: number, hours: number = 20) => {
  const date = new Date()
  date.setDate(date.getDate() + daysAhead)
  date.setHours(hours, 0, 0, 0)
  return date.toISOString()
}

const generateMockData = () => {
  console.log('🎲 Generating mock betting data...')

  // Create Mock Tournament
  const mockTournament = {
    id: uuidv4(),
    name: 'Local Dev Series 2025',
    slug: 'local-dev-series',
    game: FightingGame.STREET_FIGHTER_6,
    startDate: futureDateString(1, 10),
    endDate: futureDateString(3, 20),
    location: 'Localhost Arena',
    imageUrl: null,
    isActive: true,
    isFeatured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startGgId: null,
    streamUrl: null
  }

  // Create Mock Players
  const players = [
    {
      id: uuidv4(),
      gamerTag: 'MockPlayer_Alpha',
      country: 'USA',
      mainCharacter: 'Luke',
      eloRating: 2100,
      totalMatches: 200,
      wins: 140,
      losses: 60,
      startGgId: null,
      imageUrl: null,
      twitterHandle: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      gamerTag: 'MockPlayer_Beta',
      country: 'GBR',
      mainCharacter: 'Ken',
      eloRating: 1950,
      totalMatches: 150,
      wins: 90,
      losses: 60,
      startGgId: null,
      imageUrl: null,
      twitterHandle: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      gamerTag: 'Local_Legend',
      country: 'JPN',
      mainCharacter: 'Ryu',
      eloRating: 2300,
      totalMatches: 500,
      wins: 400,
      losses: 100,
      startGgId: null,
      imageUrl: null,
      twitterHandle: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      gamerTag: 'Underdog_123',
      country: 'CAN',
      mainCharacter: 'Chun-Li',
      eloRating: 1800,
      totalMatches: 50,
      wins: 25,
      losses: 25,
      startGgId: null,
      imageUrl: null,
      twitterHandle: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ]

  // Create Mock Matches
  const matches = [
    {
      id: uuidv4(),
      tournamentId: mockTournament.id,
      tournament: mockTournament,
      round: 'Winners Quarters',
      game: mockTournament.game,
      bestOf: 3,
      player1Id: players[0].id,
      player1: players[0],
      player2Id: players[1].id,
      player2: players[1],
      status: MatchStatus.SCHEDULED,
      scheduledStart: futureDateString(1, 15),
      bettingOpen: true,
      player1Score: 0,
      player2Score: 0,
      _count: { bets: 0 },
      startGgId: null,
      actualStart: null,
      completedAt: null,
      winnerId: null,
      bettingClosedAt: null,
      streamUrl: null,
      vodUrl: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      tournamentId: mockTournament.id,
      tournament: mockTournament,
      round: 'Losers Quarters',
      game: mockTournament.game,
      bestOf: 3,
      player1Id: players[2].id,
      player1: players[2],
      player2Id: players[3].id,
      player2: players[3],
      status: MatchStatus.SCHEDULED,
      scheduledStart: futureDateString(1, 16),
      bettingOpen: true,
      player1Score: 0,
      player2Score: 0,
      _count: { bets: 0 },
      startGgId: null,
      actualStart: null,
      completedAt: null,
      winnerId: null,
      bettingClosedAt: null,
      streamUrl: null,
      vodUrl: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ]

  // Write to mock-matches.json
  ensureDirectoryExists()
  fs.writeFileSync(MATCHES_FILE, JSON.stringify(matches, null, 2))
  console.log(`✅ Successfully generated ${matches.length} mock matches at: ${MATCHES_FILE}`)
}

generateMockData()
