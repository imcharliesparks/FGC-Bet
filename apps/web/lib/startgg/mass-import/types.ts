export interface ImportProgress {
  jobId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  phase: 'tournaments' | 'events' | 'sets' | 'participants'
  currentItem: string

  totalTournaments: number
  processedTournaments: number
  totalEvents: number
  processedEvents: number
  totalSets: number
  processedSets: number
  totalParticipants: number
  processedParticipants: number

  errorCount: number
  recentErrors: ImportError[]

  startedAt: number
  estimatedTimeRemaining?: number
  rateInfo: {
    requestsRemaining: number
    windowResetAt: number
  }
}

export interface ImportError {
  message: string
  item: string
  timestamp: number
}

export interface MassImportOptions {
  videogameId?: number
  videogameName?: string
  startDate: Date
  endDate?: Date
  jobId?: string
  resumeFromJob?: string
}

// Start.gg API response types
export interface TournamentNode {
  id: number
  name: string
  slug: string
  startAt: number
  endAt?: number
  city?: string
  countryCode?: string
  state?: string
  venueName?: string
  venueAddress?: string
  numAttendees?: number
  primaryContact?: string
  registrationClosesAt?: number
  timezone?: string
  hashtag?: string
  isOnline?: boolean
  hasOfflineEvents?: boolean
  images?: Array<{ url: string; type: string }>
  events?: EventNode[]
}

export interface EventNode {
  id: number
  name: string
  slug: string
  type?: number
  startAt?: number
  numEntrants?: number
  state?: string
  isOnline?: boolean
  videogame?: {
    id: number
    name: string
  }
}

export interface EntrantNode {
  id: number
  name: string
  initialSeedNum?: number
  participants?: ParticipantNode[]
}

export interface SetNode {
  id: number
  fullRoundText?: string
  round?: number
  identifier?: string
  state: number
  startAt?: number
  startedAt?: number
  completedAt?: number
  displayScore?: string
  totalGames?: number
  winnerId?: number
  station?: { number: number }
  phaseGroup?: {
    id: number
    phase?: { id: number }
  }
  slots: SlotNode[]
}

export interface SlotNode {
  standing?: {
    placement: number
    stats?: {
      score?: { value: number }
    }
  }
  entrant?: EntrantNode
}

export interface ParticipantNode {
  id: number
  gamerTag: string
  prefix?: string
  player?: { id: number }
  user?: {
    id: number
    images?: Array<{ url: string; type: string }>
  }
}

export interface TournamentsResponse {
  tournaments: {
    pageInfo: {
      total: number
      totalPages: number
      page: number
      perPage: number
    }
    nodes: TournamentNode[]
  }
}

export interface EventSetsResponse {
  event: {
    id: number
    name: string
    sets: {
      pageInfo: {
        total: number
        totalPages: number
      }
      nodes: SetNode[]
    }
  }
}

export interface EventEntrantsResponse {
  event: {
    id: number
    entrants: {
      pageInfo: {
        total: number
        totalPages: number
      }
      nodes: Array<{
        id: number
        name: string
        initialSeedNum?: number
        participants?: ParticipantNode[]
      }>
    }
  }
}
