# Esports Betting Platform - Complete Implementation Plan

## Project Overview
Build a full-stack web application for real-time betting on fighting game esports matches. Mobile-friendly, real-time data integration, secure transactions, and scalable architecture.

## Technology Stack
- **Frontend**: Next.js 14+ (App Router), React 18+, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL (primary), Redis (caching/real-time)
- **ORM**: Prisma
- **Authentication**: Clerk
- **Real-time**: Socket.io
- **Payment Processing**: Stripe
- **Hosting**: Vercel (frontend), Railway/Render (backend services)

---

# PHASE 1: PROJECT FOUNDATION & INFRASTRUCTURE (Weeks 1-3)

## Task 1.1: Project Initialization

### Step 1: Create Next.js Project
```bash
npx create-next-app@latest esports-betting --typescript --tailwind --app --src-dir
cd esports-betting
```

### Step 2: Install Core Dependencies
```bash
npm install @prisma/client prisma
npm install @clerk/nextjs
npm install zod
npm install socket.io socket.io-client
npm install stripe @stripe/stripe-js
npm install date-fns
npm install react-hot-toast
npm install zustand
npm install @tanstack/react-query

npm install -D @types/node
```

### Step 3: Create Project Structure
Create the following directory structure:
```
src/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── matches/
│   │   │   └── page.tsx
│   │   ├── wallet/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── admin/
│   │   ├── matches/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── matches/
│   │   ├── bets/
│   │   ├── wallet/
│   │   └── webhooks/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── matches/
│   ├── betting/
│   └── wallet/
├── lib/
│   ├── db/
│   ├── auth/
│   ├── betting/
│   └── utils/
├── types/
└── hooks/
```

### Step 4: Configure Environment Variables
Create `.env.local`:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/esports_betting"

# Redis
REDIS_URL="redis://localhost:6379"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_public
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## Task 1.2: Database Schema Design

### Step 1: Initialize Prisma
```bash
npx prisma init
```

### Step 2: Create Complete Database Schema
File: `prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User and Authentication
model User {
  id                String   @id @default(cuid())
  clerkId           String   @unique
  email             String   @unique
  username          String   @unique
  firstName         String?
  lastName          String?
  
  // KYC and Verification
  isVerified        Boolean  @default(false)
  dateOfBirth       DateTime?
  verificationLevel String   @default("none") // none, basic, full
  kycStatus         String   @default("pending") // pending, approved, rejected
  kycSubmittedAt    DateTime?
  kycApprovedAt     DateTime?
  
  // Wallet
  walletBalance     Decimal  @default(0) @db.Decimal(10, 2)
  currency          String   @default("USD")
  
  // Responsible Gambling
  dailyDepositLimit  Decimal? @db.Decimal(10, 2)
  weeklyDepositLimit Decimal? @db.Decimal(10, 2)
  monthlyDepositLimit Decimal? @db.Decimal(10, 2)
  selfExcludedUntil DateTime?
  
  // Account Status
  isActive          Boolean  @default(true)
  isBanned          Boolean  @default(false)
  banReason         String?
  
  // Relations
  bets              Bet[]
  transactions      Transaction[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([clerkId])
  @@index([email])
}

// Fighting Games and Players
model Game {
  id          String   @id @default(cuid())
  name        String   @unique // "Street Fighter 6", "Tekken 8", etc.
  shortName   String   @unique // "SF6", "T8"
  imageUrl    String?
  isActive    Boolean  @default(true)
  
  matches     Match[]
  players     Player[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Player {
  id              String   @id @default(cuid())
  name            String
  tag             String   @unique // Player's gamer tag
  country         String?
  imageUrl        String?
  
  // Rating System (ELO-style)
  rating          Int      @default(1500)
  gamesWon        Int      @default(0)
  gamesLost       Int      @default(0)
  
  gameId          String
  game            Game     @relation(fields: [gameId], references: [id])
  
  matchesAsPlayer1 Match[] @relation("Player1")
  matchesAsPlayer2 Match[] @relation("Player2")
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([gameId])
  @@index([rating])
}

// Matches and Tournaments
model Tournament {
  id          String   @id @default(cuid())
  name        String
  startDate   DateTime
  endDate     DateTime?
  location    String?
  format      String   // "Single Elimination", "Double Elimination", "Round Robin"
  prizePool   Decimal? @db.Decimal(10, 2)
  
  externalId  String?  // start.gg tournament ID
  streamUrl   String?
  
  matches     Match[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum MatchStatus {
  SCHEDULED
  LIVE
  COMPLETED
  CANCELLED
}

model Match {
  id              String      @id @default(cuid())
  
  // Game and Tournament
  gameId          String
  game            Game        @relation(fields: [gameId], references: [id])
  tournamentId    String?
  tournament      Tournament? @relation(fields: [tournamentId], references: [id])
  
  // Players
  player1Id       String
  player1         Player      @relation("Player1", fields: [player1Id], references: [id])
  player2Id       String
  player2         Player      @relation("Player2", fields: [player2Id], references: [id])
  
  // Match Details
  status          MatchStatus @default(SCHEDULED)
  scheduledAt     DateTime
  startedAt       DateTime?
  completedAt     DateTime?
  
  // Format
  bestOf          Int         @default(3) // Best of 3, 5, etc.
  
  // Results
  player1Score    Int?
  player2Score    Int?
  winnerId        String?
  
  // Betting
  betsLocked      Boolean     @default(false)
  lockTime        DateTime? // When betting closes
  
  // Metadata
  round           String?     // "Winners Finals", "Grand Finals", etc.
  streamUrl       String?
  externalId      String?     // start.gg match ID
  
  bets            Bet[]
  odds            Odds[]
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@index([gameId])
  @@index([status])
  @@index([scheduledAt])
  @@index([player1Id])
  @@index([player2Id])
}

// Betting System
enum BetType {
  MONEYLINE      // Winner of the match
  HANDICAP       // Game spread
  OVER_UNDER     // Total games in set
  FIRST_BLOOD    // First round winner
}

enum BetStatus {
  PENDING
  WON
  LOST
  VOID
  CASHED_OUT
}

model Bet {
  id              String     @id @default(cuid())
  
  // User and Match
  userId          String
  user            User       @relation(fields: [userId], references: [id])
  matchId         String
  match           Match      @relation(fields: [matchId], references: [id])
  
  // Bet Details
  betType         BetType
  selection       String     // Player ID or "over"/"under"
  amount          Decimal    @db.Decimal(10, 2)
  odds            Decimal    @db.Decimal(8, 4) // Decimal odds (e.g., 2.5)
  potentialPayout Decimal    @db.Decimal(10, 2)
  
  // Status
  status          BetStatus  @default(PENDING)
  settledAt       DateTime?
  payout          Decimal?   @db.Decimal(10, 2)
  
  // Metadata
  placedAt        DateTime   @default(now())
  ipAddress       String?
  
  @@index([userId])
  @@index([matchId])
  @@index([status])
  @@index([placedAt])
}

// Odds Management
model Odds {
  id              String   @id @default(cuid())
  
  matchId         String
  match           Match    @relation(fields: [matchId], references: [id])
  
  betType         BetType
  selection       String   // Player ID or outcome
  
  // Odds Values
  decimalOdds     Decimal  @db.Decimal(8, 4)
  americanOdds    Int
  impliedProb     Decimal  @db.Decimal(5, 4) // 0.0000 to 1.0000
  
  // Volume and Liability
  totalBetAmount  Decimal  @default(0) @db.Decimal(12, 2)
  betCount        Int      @default(0)
  liability       Decimal  @default(0) @db.Decimal(12, 2)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([matchId, betType, selection])
  @@index([updatedAt])
}

// Financial Transactions
enum TransactionType {
  DEPOSIT
  WITHDRAWAL
  BET_PLACEMENT
  BET_PAYOUT
  BET_REFUND
  ADMIN_ADJUSTMENT
}

enum TransactionStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

model Transaction {
  id              String            @id @default(cuid())
  
  userId          String
  user            User              @relation(fields: [userId], references: [id])
  
  type            TransactionType
  status          TransactionStatus @default(PENDING)
  
  amount          Decimal           @db.Decimal(10, 2)
  currency        String            @default("USD")
  
  // Payment Details
  stripePaymentId String?           @unique
  paymentMethod   String?
  
  // Metadata
  description     String?
  metadata        Json?
  
  // Balance Tracking
  balanceBefore   Decimal           @db.Decimal(10, 2)
  balanceAfter    Decimal           @db.Decimal(10, 2)
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@index([userId])
  @@index([type])
  @@index([status])
  @@index([createdAt])
}

// Admin and Audit
model AuditLog {
  id          String   @id @default(cuid())
  
  userId      String?
  action      String
  entityType  String   // "Match", "Bet", "User", etc.
  entityId    String?
  
  changes     Json?
  ipAddress   String?
  userAgent   String?
  
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([entityType, entityId])
  @@index([createdAt])
}
```

### Step 3: Create and Run Migrations
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### Step 4: Create Prisma Client Singleton
File: `src/lib/db/prisma.ts`
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## Task 1.3: Authentication Setup

### Step 1: Configure Clerk Middleware
File: `src/middleware.ts`
```typescript
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/sign-in(.*)", "/sign-up(.*)", "/api/webhooks(.*)"],
  ignoredRoutes: ["/api/webhooks/clerk"],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

### Step 2: Create Clerk Webhook Handler
File: `src/app/api/webhooks/clerk/route.ts`
```typescript
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env')
  }

  const headerPayload = headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error: Verification failed', { status: 400 })
  }

  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, username } = evt.data

    await prisma.user.create({
      data: {
        clerkId: id,
        email: email_addresses[0].email_address,
        username: username || email_addresses[0].email_address.split('@')[0],
        firstName: first_name || null,
        lastName: last_name || null,
      },
    })
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, username } = evt.data

    await prisma.user.update({
      where: { clerkId: id },
      data: {
        email: email_addresses[0].email_address,
        username: username || undefined,
        firstName: first_name || null,
        lastName: last_name || null,
      },
    })
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data
    
    await prisma.user.update({
      where: { clerkId: id },
      data: { isActive: false },
    })
  }

  return new Response('Webhook processed', { status: 200 })
}
```

### Step 3: Create Auth Helper Functions
File: `src/lib/auth/helpers.ts`
```typescript
import { auth, currentUser } from '@clerk/nextjs'
import { prisma } from '@/lib/db/prisma'

export async function getCurrentUser() {
  const { userId } = auth()
  
  if (!userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

export async function requireVerifiedUser() {
  const user = await requireAuth()
  
  if (!user.isVerified) {
    throw new Error('User not verified')
  }

  return user
}

export async function requireAdmin() {
  const clerkUser = await currentUser()
  const user = await requireAuth()
  
  // Check if user has admin role in Clerk metadata
  const isAdmin = clerkUser?.publicMetadata?.role === 'admin'
  
  if (!isAdmin) {
    throw new Error('Admin access required')
  }

  return user
}
```

---

## Task 1.4: Wallet System Implementation

### Step 1: Create Wallet Service
File: `src/lib/wallet/service.ts`
```typescript
import { prisma } from '@/lib/db/prisma'
import { TransactionType, TransactionStatus } from '@prisma/client'

export class WalletService {
  /**
   * Get user's current wallet balance
   */
  static async getBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    })

    return Number(user?.walletBalance || 0)
  }

  /**
   * Add funds to wallet (for deposits and payouts)
   */
  static async addFunds(
    userId: string,
    amount: number,
    type: TransactionType,
    metadata?: any
  ) {
    return await prisma.$transaction(async (tx) => {
      // Get current balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true },
      })

      if (!user) {
        throw new Error('User not found')
      }

      const balanceBefore = Number(user.walletBalance)
      const balanceAfter = balanceBefore + amount

      // Update user balance
      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: balanceAfter },
      })

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type,
          status: TransactionStatus.COMPLETED,
          amount,
          balanceBefore,
          balanceAfter,
          description: `${type} of $${amount}`,
          metadata,
        },
      })

      return { transaction, newBalance: balanceAfter }
    })
  }

  /**
   * Deduct funds from wallet (for bets and withdrawals)
   */
  static async deductFunds(
    userId: string,
    amount: number,
    type: TransactionType,
    metadata?: any
  ) {
    return await prisma.$transaction(async (tx) => {
      // Get current balance with row lock
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true },
      })

      if (!user) {
        throw new Error('User not found')
      }

      const balanceBefore = Number(user.walletBalance)
      
      if (balanceBefore < amount) {
        throw new Error('Insufficient funds')
      }

      const balanceAfter = balanceBefore - amount

      // Update user balance
      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: balanceAfter },
      })

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type,
          status: TransactionStatus.COMPLETED,
          amount,
          balanceBefore,
          balanceAfter,
          description: `${type} of $${amount}`,
          metadata,
        },
      })

      return { transaction, newBalance: balanceAfter }
    })
  }

  /**
   * Get transaction history
   */
  static async getTransactions(userId: string, limit = 50) {
    return await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Check if user can place bet (balance and limits)
   */
  static async canPlaceBet(userId: string, amount: number): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        walletBalance: true,
        isActive: true,
        isBanned: true,
        selfExcludedUntil: true,
      },
    })

    if (!user || !user.isActive || user.isBanned) {
      return false
    }

    if (user.selfExcludedUntil && user.selfExcludedUntil > new Date()) {
      return false
    }

    return Number(user.walletBalance) >= amount
  }
}
```

### Step 2: Create Wallet API Endpoints
File: `src/app/api/wallet/balance/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { WalletService } from '@/lib/wallet/service'

export async function GET() {
  try {
    const user = await requireAuth()
    const balance = await WalletService.getBalance(user.id)

    return NextResponse.json({ balance })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    )
  }
}
```

File: `src/app/api/wallet/transactions/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { WalletService } from '@/lib/wallet/service'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const transactions = await WalletService.getTransactions(user.id, limit)

    return NextResponse.json({ transactions })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
```

---

## Task 1.5: Admin Panel Foundation

### Step 1: Create Admin Layout
File: `src/app/admin/layout.tsx`
```typescript
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/helpers'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireAdmin()
  } catch {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">Admin Panel</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a
                  href="/admin/matches"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                >
                  Matches
                </a>
                <a
                  href="/admin/users"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Users
                </a>
                <a
                  href="/admin/bets"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Bets
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
```

### Step 2: Create Match Management Page
File: `src/app/admin/matches/page.tsx`
```typescript
import { prisma } from '@/lib/db/prisma'
import { MatchCreateForm } from '@/components/admin/MatchCreateForm'
import { MatchList } from '@/components/admin/MatchList'

export default async function AdminMatchesPage() {
  const matches = await prisma.match.findMany({
    include: {
      game: true,
      player1: true,
      player2: true,
      tournament: true,
    },
    orderBy: { scheduledAt: 'desc' },
    take: 50,
  })

  const games = await prisma.game.findMany({
    where: { isActive: true },
  })

  const players = await prisma.player.findMany({
    include: { game: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Match Management</h2>
        <MatchCreateForm games={games} players={players} />
      </div>
      
      <div>
        <h3 className="text-xl font-bold mb-4">Recent Matches</h3>
        <MatchList matches={matches} />
      </div>
    </div>
  )
}
```

---

# PHASE 2: MATCH DATA INTEGRATION (Weeks 4-6)

## Task 2.1: Start.gg API Integration

### Step 1: Install GraphQL Client
```bash
npm install graphql-request graphql
```

### Step 2: Create Start.gg API Client
File: `src/lib/startgg/client.ts`
```typescript
import { GraphQLClient } from 'graphql-request'

const STARTGG_API_URL = 'https://api.start.gg/gql/alpha'

export class StartGGClient {
  private client: GraphQLClient

  constructor(apiKey: string) {
    this.client = new GraphQLClient(STARTGG_API_URL, {
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
    })
  }

  /**
   * Get tournament details by slug
   */
  async getTournament(slug: string) {
    const query = `
      query GetTournament($slug: String!) {
        tournament(slug: $slug) {
          id
          name
          slug
          startAt
          endAt
          city
          countryCode
          images {
            url
            type
          }
          events {
            id
            name
            slug
            videogame {
              id
              name
            }
            phases {
              id
              name
            }
          }
        }
      }
    `

    return await this.client.request(query, { slug })
  }

  /**
   * Get event sets (matches)
   */
  async getEventSets(eventId: number, page = 1, perPage = 50) {
    const query = `
      query GetEventSets($eventId: ID!, $page: Int!, $perPage: Int!) {
        event(id: $eventId) {
          id
          name
          sets(page: $page, perPage: $perPage, sortType: STANDARD) {
            pageInfo {
              total
              totalPages
            }
            nodes {
              id
              state
              fullRoundText
              startedAt
              completedAt
              winnerId
              slots {
                standing {
                  stats {
                    score {
                      value
                    }
                  }
                }
                entrant {
                  id
                  name
                  participants {
                    id
                    gamerTag
                    user {
                      id
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    `

    return await this.client.request(query, { eventId, page, perPage })
  }

  /**
   * Get standings for an event
   */
  async getEventStandings(eventId: number) {
    const query = `
      query GetEventStandings($eventId: ID!) {
        event(id: $eventId) {
          id
          name
          standings(query: {
            perPage: 50
            page: 1
          }) {
            nodes {
              placement
              entrant {
                id
                name
                participants {
                  gamerTag
                  user {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    `

    return await this.client.request(query, { eventId })
  }
}
```

### Step 3: Create Match Import Service
File: `src/lib/startgg/import.ts`
```typescript
import { StartGGClient } from './client'
import { prisma } from '@/lib/db/prisma'

export class MatchImporter {
  private client: StartGGClient

  constructor(apiKey: string) {
    this.client = new StartGGClient(apiKey)
  }

  /**
   * Import tournament and create matches
   */
  async importTournament(slug: string) {
    const tournamentData = await this.client.getTournament(slug)
    const tournament = tournamentData.tournament

    // Create tournament in database
    const dbTournament = await prisma.tournament.create({
      data: {
        name: tournament.name,
        startDate: new Date(tournament.startAt * 1000),
        endDate: tournament.endAt ? new Date(tournament.endAt * 1000) : null,
        location: tournament.city || null,
        externalId: tournament.id.toString(),
        format: 'Double Elimination', // Default, can be parsed from phases
      },
    })

    // Process each event (game)
    for (const event of tournament.events) {
      await this.importEvent(event.id, dbTournament.id, event.videogame.name)
    }

    return dbTournament
  }

  /**
   * Import matches from an event
   */
  private async importEvent(
    eventId: number,
    tournamentId: string,
    gameName: string
  ) {
    // Find or create game
    let game = await prisma.game.findFirst({
      where: { name: gameName },
    })

    if (!game) {
      game = await prisma.game.create({
        data: {
          name: gameName,
          shortName: this.getGameShortName(gameName),
        },
      })
    }

    // Get all sets (matches) from event
    const setsData = await this.client.getEventSets(eventId)
    const sets = setsData.event.sets.nodes

    for (const set of sets) {
      // Skip if not a valid 1v1 match
      if (set.slots.length !== 2) continue

      const player1Data = set.slots[0].entrant.participants[0]
      const player2Data = set.slots[1].entrant.participants[0]

      // Create or find players
      const player1 = await this.findOrCreatePlayer(
        player1Data.gamerTag,
        game.id
      )
      const player2 = await this.findOrCreatePlayer(
        player2Data.gamerTag,
        game.id
      )

      // Determine match status
      let status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' = 'SCHEDULED'
      if (set.completedAt) status = 'COMPLETED'
      else if (set.startedAt) status = 'LIVE'

      // Create match
      await prisma.match.create({
        data: {
          gameId: game.id,
          tournamentId,
          player1Id: player1.id,
          player2Id: player2.id,
          status,
          scheduledAt: set.startedAt
            ? new Date(set.startedAt * 1000)
            : new Date(),
          startedAt: set.startedAt
            ? new Date(set.startedAt * 1000)
            : null,
          completedAt: set.completedAt
            ? new Date(set.completedAt * 1000)
            : null,
          player1Score: set.slots[0].standing?.stats?.score?.value || null,
          player2Score: set.slots[1].standing?.stats?.score?.value || null,
          winnerId: set.winnerId?.toString() || null,
          round: set.fullRoundText,
          externalId: set.id.toString(),
        },
      })
    }
  }

  /**
   * Find existing player or create new one
   */
  private async findOrCreatePlayer(gamerTag: string, gameId: string) {
    let player = await prisma.player.findFirst({
      where: {
        tag: gamerTag,
        gameId,
      },
    })

    if (!player) {
      player = await prisma.player.create({
        data: {
          name: gamerTag,
          tag: gamerTag,
          gameId,
        },
      })
    }

    return player
  }

  /**
   * Get short name for common games
   */
  private getGameShortName(fullName: string): string {
    const mapping: Record<string, string> = {
      'Street Fighter 6': 'SF6',
      'Tekken 8': 'T8',
      'Guilty Gear -Strive-': 'GGST',
      'Mortal Kombat 1': 'MK1',
      'The King of Fighters XV': 'KOF15',
    }

    return mapping[fullName] || fullName.substring(0, 10)
  }
}
```

### Step 4: Create Admin Import Interface
File: `src/app/api/admin/import/startgg/route.ts`
```typescript
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
        { error: 'start.gg API key not configured' },
        { status: 500 }
      )
    }

    const importer = new MatchImporter(apiKey)
    const tournament = await importer.importTournament(tournamentSlug)

    return NextResponse.json({
      success: true,
      tournament,
    })
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error.message || 'Import failed' },
      { status: 500 }
    )
  }
}
```

---

## Task 2.2: Manual Match Management

### Step 1: Create Match CRUD API
File: `src/app/api/admin/matches/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/helpers'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createMatchSchema = z.object({
  gameId: z.string(),
  tournamentId: z.string().optional(),
  player1Id: z.string(),
  player2Id: z.string(),
  scheduledAt: z.string().datetime(),
  bestOf: z.number().int().min(1).max(7),
  round: z.string().optional(),
  streamUrl: z.string().url().optional(),
})

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const body = await request.json()
    const data = createMatchSchema.parse(body)

    const match = await prisma.match.create({
      data: {
        ...data,
        scheduledAt: new Date(data.scheduledAt),
        status: 'SCHEDULED',
      },
      include: {
        game: true,
        player1: true,
        player2: true,
        tournament: true,
      },
    })

    return NextResponse.json({ match })
  } catch (error: any) {
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
```

File: `src/app/api/admin/matches/[id]/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/helpers'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const updateMatchSchema = z.object({
  status: z.enum(['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED']).optional(),
  player1Score: z.number().int().min(0).optional(),
  player2Score: z.number().int().min(0).optional(),
  winnerId: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  betsLocked: z.boolean().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    const body = await request.json()
    const data = updateMatchSchema.parse(body)

    // Convert datetime strings to Date objects
    const updateData: any = { ...data }
    if (data.startedAt) updateData.startedAt = new Date(data.startedAt)
    if (data.completedAt) updateData.completedAt = new Date(data.completedAt)

    const match = await prisma.match.update({
      where: { id: params.id },
      data: updateData,
      include: {
        game: true,
        player1: true,
        player2: true,
      },
    })

    // If match is completed, settle all bets
    if (data.status === 'COMPLETED' && data.winnerId) {
      // This will be implemented in Phase 3
      // await settleBets(match.id, data.winnerId)
    }

    return NextResponse.json({ match })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update match' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    // Check if match has any bets
    const betCount = await prisma.bet.count({
      where: { matchId: params.id },
    })

    if (betCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete match with existing bets' },
        { status: 400 }
      )
    }

    await prisma.match.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete match' },
      { status: 500 }
    )
  }
}
```

---

## Task 2.3: Player and Game Management

### Step 1: Create Player Management API
File: `src/app/api/admin/players/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/helpers'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createPlayerSchema = z.object({
  name: z.string().min(1),
  tag: z.string().min(1),
  gameId: z.string(),
  country: z.string().optional(),
  imageUrl: z.string().url().optional(),
  rating: z.number().int().min(0).max(3000).optional(),
})

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const body = await request.json()
    const data = createPlayerSchema.parse(body)

    // Check if player already exists
    const existing = await prisma.player.findFirst({
      where: {
        tag: data.tag,
        gameId: data.gameId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Player with this tag already exists for this game' },
        { status: 400 }
      )
    }

    const player = await prisma.player.create({
      data,
      include: { game: true },
    })

    return NextResponse.json({ player })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create player' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')
    const search = searchParams.get('search')

    const where: any = {}
    if (gameId) where.gameId = gameId
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tag: { contains: search, mode: 'insensitive' } },
      ]
    }

    const players = await prisma.player.findMany({
      where,
      include: { game: true },
      orderBy: { rating: 'desc' },
    })

    return NextResponse.json({ players })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch players' },
      { status: 500 }
    )
  }
}
```

### Step 2: Create Game Management API
File: `src/app/api/admin/games/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/helpers'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createGameSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1).max(10),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
})

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const body = await request.json()
    const data = createGameSchema.parse(body)

    const game = await prisma.game.create({
      data,
    })

    return NextResponse.json({ game })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create game' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ games })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch games' },
      { status: 500 }
    )
  }
}
```

---

# PHASE 3: BETTING ENGINE (Weeks 7-10)

## Task 3.1: Odds Calculation System

### Step 1: Create Odds Calculator Service
File: `src/lib/betting/odds-calculator.ts`
```typescript
export interface PlayerStats {
  rating: number
  gamesWon: number
  gamesLost: number
  recentForm?: number[] // Last 5 matches: 1 for win, 0 for loss
}

export class OddsCalculator {
  private readonly HOUSE_EDGE = 0.05 // 5% house edge
  private readonly MIN_ODDS = 1.01
  private readonly MAX_ODDS = 50.0

  /**
   * Calculate win probability using ELO-style rating system
   */
  calculateWinProbability(
    player1Stats: PlayerStats,
    player2Stats: PlayerStats
  ): { player1WinProb: number; player2WinProb: number } {
    const ratingDiff = player1Stats.rating - player2Stats.rating
    
    // ELO formula: P(A beats B) = 1 / (1 + 10^((RB - RA) / 400))
    const player1WinProb = 1 / (1 + Math.pow(10, -ratingDiff / 400))
    const player2WinProb = 1 - player1WinProb

    // Adjust based on recent form if available
    const player1FormAdjustment = this.getFormAdjustment(
      player1Stats.recentForm
    )
    const player2FormAdjustment = this.getFormAdjustment(
      player2Stats.recentForm
    )

    // Apply form adjustments (±5% max)
    const adjustedP1 = player1WinProb + player1FormAdjustment - player2FormAdjustment
    const adjustedP2 = 1 - adjustedP1

    // Ensure probabilities are valid
    return {
      player1WinProb: Math.max(0.01, Math.min(0.99, adjustedP1)),
      player2WinProb: Math.max(0.01, Math.min(0.99, adjustedP2)),
    }
  }

  /**
   * Calculate form adjustment based on recent results
   */
  private getFormAdjustment(recentForm?: number[]): number {
    if (!recentForm || recentForm.length === 0) return 0

    const winRate = recentForm.reduce((a, b) => a + b, 0) / recentForm.length
    // Adjust by ±5% based on recent form
    return (winRate - 0.5) * 0.1
  }

  /**
   * Convert probability to decimal odds with house edge
   */
  convertToDecimalOdds(probability: number): number {
    // Add house edge to probability (making it harder to win)
    const adjustedProb = probability * (1 + this.HOUSE_EDGE)
    
    // Ensure probability doesn't exceed 1
    const finalProb = Math.min(0.99, adjustedProb)
    
    // Calculate odds: 1 / probability
    const odds = 1 / finalProb
    
    // Clamp odds within reasonable bounds
    return Math.max(this.MIN_ODDS, Math.min(this.MAX_ODDS, odds))
  }

  /**
   * Convert decimal odds to American odds
   */
  decimalToAmericanOdds(decimalOdds: number): number {
    if (decimalOdds >= 2.0) {
      return Math.round((decimalOdds - 1) * 100)
    } else {
      return Math.round(-100 / (decimalOdds - 1))
    }
  }

  /**
   * Adjust odds based on betting volume (market-making)
   */
  adjustOddsForVolume(
    currentOdds: number,
    totalBetAmount: number,
    betAmountOnSide: number
  ): number {
    if (totalBetAmount === 0) return currentOdds

    const exposureRatio = betAmountOnSide / totalBetAmount
    
    // If more than 60% of money is on one side, adjust odds
    if (exposureRatio > 0.6) {
      const adjustment = (exposureRatio - 0.6) * 0.5 // Max 20% adjustment
      return currentOdds * (1 - adjustment)
    } else if (exposureRatio < 0.4) {
      const adjustment = (0.4 - exposureRatio) * 0.5
      return currentOdds * (1 + adjustment)
    }

    return currentOdds
  }

  /**
   * Calculate implied probability from odds
   */
  oddsToImpliedProbability(decimalOdds: number): number {
    return 1 / decimalOdds
  }

  /**
   * Calculate potential payout
   */
  calculatePayout(stake: number, decimalOdds: number): number {
    return stake * decimalOdds
  }

  /**
   * Calculate profit
   */
  calculateProfit(stake: number, decimalOdds: number): number {
    return stake * (decimalOdds - 1)
  }
}
```

### Step 2: Create Odds Management Service
File: `src/lib/betting/odds-service.ts`
```typescript
import { prisma } from '@/lib/db/prisma'
import { OddsCalculator } from './odds-calculator'
import { BetType } from '@prisma/client'

export class OddsService {
  private calculator: OddsCalculator

  constructor() {
    this.calculator = new OddsCalculator()
  }

  /**
   * Initialize odds for a new match
   */
  async initializeMatchOdds(matchId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: true,
        player2: true,
      },
    })

    if (!match) throw new Error('Match not found')

    // Calculate initial probabilities
    const probabilities = this.calculator.calculateWinProbability(
      {
        rating: match.player1.rating,
        gamesWon: match.player1.gamesWon,
        gamesLost: match.player1.gamesLost,
      },
      {
        rating: match.player2.rating,
        gamesWon: match.player2.gamesWon,
        gamesLost: match.player2.gamesLost,
      }
    )

    // Create moneyline odds
    const player1Odds = this.calculator.convertToDecimalOdds(
      probabilities.player1WinProb
    )
    const player2Odds = this.calculator.convertToDecimalOdds(
      probabilities.player2WinProb
    )

    await prisma.odds.createMany({
      data: [
        {
          matchId,
          betType: BetType.MONEYLINE,
          selection: match.player1Id,
          decimalOdds: player1Odds,
          americanOdds: this.calculator.decimalToAmericanOdds(player1Odds),
          impliedProb: probabilities.player1WinProb,
        },
        {
          matchId,
          betType: BetType.MONEYLINE,
          selection: match.player2Id,
          decimalOdds: player2Odds,
          americanOdds: this.calculator.decimalToAmericanOdds(player2Odds),
          impliedProb: probabilities.player2WinProb,
        },
      ],
    })

    return { player1Odds, player2Odds }
  }

  /**
   * Get current odds for a match
   */
  async getMatchOdds(matchId: string) {
    return await prisma.odds.findMany({
      where: { matchId },
      orderBy: { updatedAt: 'desc' },
    })
  }

  /**
   * Update odds based on new bets
   */
  async updateOddsAfterBet(matchId: string, betType: BetType) {
    // Get all bets for this match and bet type
    const bets = await prisma.bet.findMany({
      where: {
        matchId,
        betType,
        status: 'PENDING',
      },
    })

    const totalBetAmount = bets.reduce(
      (sum, bet) => sum + Number(bet.amount),
      0
    )

    // Group bets by selection
    const betsBySelection = new Map<string, number>()
    for (const bet of bets) {
      const current = betsBySelection.get(bet.selection) || 0
      betsBySelection.set(bet.selection, current + Number(bet.amount))
    }

    // Update odds for each selection
    for (const [selection, betAmount] of betsBySelection) {
      const currentOdds = await prisma.odds.findFirst({
        where: { matchId, betType, selection },
        orderBy: { createdAt: 'desc' },
      })

      if (!currentOdds) continue

      const newDecimalOdds = this.calculator.adjustOddsForVolume(
        Number(currentOdds.decimalOdds),
        totalBetAmount,
        betAmount
      )

      // Create new odds record
      await prisma.odds.create({
        data: {
          matchId,
          betType,
          selection,
          decimalOdds: newDecimalOdds,
          americanOdds: this.calculator.decimalToAmericanOdds(newDecimalOdds),
          impliedProb: this.calculator.oddsToImpliedProbability(newDecimalOdds),
          totalBetAmount,
          betCount: bets.filter((b) => b.selection === selection).length,
          liability: betAmount * (newDecimalOdds - 1),
        },
      })
    }
  }
}
```

---

## Task 3.2: Bet Placement System

### Step 1: Create Betting Service
File: `src/lib/betting/betting-service.ts`
```typescript
import { prisma } from '@/lib/db/prisma'
import { WalletService } from '@/lib/wallet/service'
import { OddsCalculator } from './odds-calculator'
import { BetType, BetStatus, TransactionType } from '@prisma/client'

export interface PlaceBetParams {
  userId: string
  matchId: string
  betType: BetType
  selection: string // Player ID or outcome
  amount: number
}

export class BettingService {
  private calculator: OddsCalculator

  constructor() {
    this.calculator = new OddsCalculator()
  }

  /**
   * Place a bet on a match
   */
  async placeBet(params: PlaceBetParams) {
    const { userId, matchId, betType, selection, amount } = params

    return await prisma.$transaction(async (tx) => {
      // 1. Validate match
      const match = await tx.match.findUnique({
        where: { id: matchId },
      })

      if (!match) {
        throw new Error('Match not found')
      }

      if (match.status !== 'SCHEDULED') {
        throw new Error('Betting is not available for this match')
      }

      if (match.betsLocked) {
        throw new Error('Betting has been locked for this match')
      }

      // 2. Validate bet amount
      if (amount < 1) {
        throw new Error('Minimum bet amount is $1')
      }

      if (amount > 1000) {
        throw new Error('Maximum bet amount is $1000')
      }

      // 3. Check user balance
      const canBet = await WalletService.canPlaceBet(userId, amount)
      if (!canBet) {
        throw new Error('Insufficient balance or account restricted')
      }

      // 4. Get current odds
      const currentOdds = await tx.odds.findFirst({
        where: {
          matchId,
          betType,
          selection,
        },
        orderBy: { createdAt: 'desc' },
      })

      if (!currentOdds) {
        throw new Error('Odds not available for this selection')
      }

      const decimalOdds = Number(currentOdds.decimalOdds)
      const potentialPayout = this.calculator.calculatePayout(amount, decimalOdds)

      // 5. Deduct funds from wallet
      await WalletService.deductFunds(
        userId,
        amount,
        TransactionType.BET_PLACEMENT,
        {
          matchId,
          betType,
          selection,
        }
      )

      // 6. Create bet
      const bet = await tx.bet.create({
        data: {
          userId,
          matchId,
          betType,
          selection,
          amount,
          odds: decimalOdds,
          potentialPayout,
          status: BetStatus.PENDING,
        },
      })

      // 7. Update odds statistics
      await tx.odds.update({
        where: { id: currentOdds.id },
        data: {
          totalBetAmount: { increment: amount },
          betCount: { increment: 1 },
          liability: { increment: potentialPayout - amount },
        },
      })

      return bet
    })
  }

  /**
   * Get user's active bets
   */
  async getUserBets(userId: string, status?: BetStatus) {
    const where: any = { userId }
    if (status) where.status = status

    return await prisma.bet.findMany({
      where,
      include: {
        match: {
          include: {
            game: true,
            player1: true,
            player2: true,
          },
        },
      },
      orderBy: { placedAt: 'desc' },
    })
  }

  /**
   * Get match bets for admin
   */
  async getMatchBets(matchId: string) {
    return await prisma.bet.findMany({
      where: { matchId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { placedAt: 'desc' },
    })
  }

  /**
   * Calculate total liability for a match
   */
  async calculateMatchLiability(matchId: string) {
    const bets = await prisma.bet.findMany({
      where: {
        matchId,
        status: BetStatus.PENDING,
      },
    })

    const liability = bets.reduce((sum, bet) => {
      return sum + (Number(bet.potentialPayout) - Number(bet.amount))
    }, 0)

    return liability
  }
}
```

### Step 2: Create Bet Placement API
File: `src/app/api/bets/place/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { requireVerifiedUser } from '@/lib/auth/helpers'
import { BettingService } from '@/lib/betting/betting-service'
import { OddsService } from '@/lib/betting/odds-service'
import { z } from 'zod'

const placeBetSchema = z.object({
  matchId: z.string(),
  betType: z.enum(['MONEYLINE', 'HANDICAP', 'OVER_UNDER', 'FIRST_BLOOD']),
  selection: z.string(),
  amount: z.number().min(1).max(1000),
})

export async function POST(request: Request) {
  try {
    const user = await requireVerifiedUser()
    const body = await request.json()
    const data = placeBetSchema.parse(body)

    const bettingService = new BettingService()
    const bet = await bettingService.placeBet({
      userId: user.id,
      ...data,
    })

    // Update odds after bet placement
    const oddsService = new OddsService()
    await oddsService.updateOddsAfterBet(data.matchId, data.betType)

    return NextResponse.json({ bet })
  } catch (error: any) {
    console.error('Bet placement error:', error)
    
    return NextResponse.json(
      { error: error.message || 'Failed to place bet' },
      { status: 400 }
    )
  }
}
```

File: `src/app/api/bets/user/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { BettingService } from '@/lib/betting/betting-service'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as any

    const bettingService = new BettingService()
    const bets = await bettingService.getUserBets(user.id, status)

    return NextResponse.json({ bets })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bets' },
      { status: 500 }
    )
  }
}
```

---

## Task 3.3: Bet Settlement System

### Step 1: Create Settlement Service
File: `src/lib/betting/settlement-service.ts`
```typescript
import { prisma } from '@/lib/db/prisma'
import { WalletService } from '@/lib/wallet/service'
import { BetStatus, TransactionType, BetType } from '@prisma/client'

export class SettlementService {
  /**
   * Settle all bets for a completed match
   */
  async settleMatch(matchId: string, winnerId: string) {
    return await prisma.$transaction(async (tx) => {
      // Get match details
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: {
          player1: true,
          player2: true,
        },
      })

      if (!match) {
        throw new Error('Match not found')
      }

      if (match.status !== 'COMPLETED') {
        throw new Error('Match is not completed')
      }

      // Get all pending bets for this match
      const bets = await tx.bet.findMany({
        where: {
          matchId,
          status: BetStatus.PENDING,
        },
      })

      let totalPayout = 0
      let totalSettled = 0

      // Settle each bet
      for (const bet of bets) {
        const isWinner = this.determineWinner(bet, winnerId, match)
        
        if (isWinner) {
          // User won - pay out winnings
          const payout = Number(bet.potentialPayout)
          
          await WalletService.addFunds(
            bet.userId,
            payout,
            TransactionType.BET_PAYOUT,
            {
              betId: bet.id,
              matchId,
            }
          )

          await tx.bet.update({
            where: { id: bet.id },
            data: {
              status: BetStatus.WON,
              payout,
              settledAt: new Date(),
            },
          })

          totalPayout += payout
        } else {
          // User lost
          await tx.bet.update({
            where: { id: bet.id },
            data: {
              status: BetStatus.LOST,
              payout: 0,
              settledAt: new Date(),
            },
          })
        }

        totalSettled++
      }

      // Update player ratings
      await this.updatePlayerRatings(match, winnerId)

      return {
        totalSettled,
        totalPayout,
      }
    })
  }

  /**
   * Determine if a bet is a winner
   */
  private determineWinner(bet: any, winnerId: string, match: any): boolean {
    switch (bet.betType) {
      case BetType.MONEYLINE:
        return bet.selection === winnerId

      case BetType.HANDICAP:
        // TODO: Implement handicap logic
        return false

      case BetType.OVER_UNDER:
        // TODO: Implement over/under logic
        return false

      case BetType.FIRST_BLOOD:
        // TODO: Implement first blood logic
        return false

      default:
        return false
    }
  }

  /**
   * Update player ratings after match
   */
  private async updatePlayerRatings(match: any, winnerId: string) {
    const K_FACTOR = 32 // ELO K-factor

    const player1Rating = match.player1.rating
    const player2Rating = match.player2.rating

    // Calculate expected scores
    const player1Expected = 1 / (1 + Math.pow(10, (player2Rating - player1Rating) / 400))
    const player2Expected = 1 - player1Expected

    // Calculate actual scores
    const player1Score = winnerId === match.player1Id ? 1 : 0
    const player2Score = winnerId === match.player2Id ? 1 : 0

    // Calculate new ratings
    const player1NewRating = Math.round(
      player1Rating + K_FACTOR * (player1Score - player1Expected)
    )
    const player2NewRating = Math.round(
      player2Rating + K_FACTOR * (player2Score - player2Expected)
    )

    // Update player records
    await prisma.player.update({
      where: { id: match.player1Id },
      data: {
        rating: player1NewRating,
        gamesWon: { increment: player1Score },
        gamesLost: { increment: 1 - player1Score },
      },
    })

    await prisma.player.update({
      where: { id: match.player2Id },
      data: {
        rating: player2NewRating,
        gamesWon: { increment: player2Score },
        gamesLost: { increment: 1 - player2Score },
      },
    })
  }

  /**
   * Void bets for a cancelled match
   */
  async voidMatch(matchId: string) {
    return await prisma.$transaction(async (tx) => {
      const bets = await tx.bet.findMany({
        where: {
          matchId,
          status: BetStatus.PENDING,
        },
      })

      for (const bet of bets) {
        // Refund bet amount
        await WalletService.addFunds(
          bet.userId,
          Number(bet.amount),
          TransactionType.BET_REFUND,
          {
            betId: bet.id,
            matchId,
          }
        )

        await tx.bet.update({
          where: { id: bet.id },
          data: {
            status: BetStatus.VOID,
            settledAt: new Date(),
          },
        })
      }

      return bets.length
    })
  }
}
```

### Step 2: Create Settlement API Endpoint
File: `src/app/api/admin/matches/[id]/settle/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/helpers'
import { SettlementService } from '@/lib/betting/settlement-service'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    const { winnerId } = await request.json()

    if (!winnerId) {
      return NextResponse.json(
        { error: 'Winner ID required' },
        { status: 400 }
      )
    }

    // Update match with winner
    await prisma.match.update({
      where: { id: params.id },
      data: {
        winnerId,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })

    // Settle all bets
    const settlementService = new SettlementService()
    const result = await settlementService.settleMatch(params.id, winnerId)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('Settlement error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to settle match' },
      { status: 500 }
    )
  }
}
```

---

# PHASE 4: REAL-TIME FEATURES (Weeks 11-14)

## Task 4.1: WebSocket Server Setup

### Step 1: Install Redis Client
```bash
npm install ioredis
npm install @types/ioredis -D
```

### Step 2: Create Redis Client
File: `src/lib/redis/client.ts`
```typescript
import Redis from 'ioredis'

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL
  }

  throw new Error('REDIS_URL not defined')
}

export const redis = new Redis(getRedisUrl())

export const pubClient = redis
export const subClient = redis.duplicate()
```

### Step 3: Create WebSocket Server
File: `src/lib/websocket/server.ts`
```typescript
import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { pubClient, subClient } from '@/lib/redis/client'
import { prisma } from '@/lib/db/prisma'

export class WebSocketServer {
  private io: SocketIOServer

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        methods: ['GET', 'POST'],
      },
      path: '/api/socket',
    })

    this.setupEventHandlers()
    this.setupRedisSubscriptions()
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id)

      // Join match rooms
      socket.on('join-match', async (matchId: string) => {
        await socket.join(`match:${matchId}`)
        console.log(`Socket ${socket.id} joined match:${matchId}`)

        // Send current match state
        const match = await prisma.match.findUnique({
          where: { id: matchId },
          include: {
            game: true,
            player1: true,
            player2: true,
          },
        })

        if (match) {
          socket.emit('match-state', match)
        }

        // Send current odds
        const odds = await prisma.odds.findMany({
          where: { matchId },
          orderBy: { createdAt: 'desc' },
        })

        socket.emit('odds-update', odds)
      })

      // Leave match rooms
      socket.on('leave-match', (matchId: string) => {
        socket.leave(`match:${matchId}`)
        console.log(`Socket ${socket.id} left match:${matchId}`)
      })

      // Join user room for personal updates
      socket.on('authenticate', (userId: string) => {
        socket.join(`user:${userId}`)
        console.log(`Socket ${socket.id} authenticated as user:${userId}`)
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })
  }

  private setupRedisSubscriptions() {
    // Subscribe to match updates
    subClient.subscribe('match:updates', 'odds:updates', 'bet:updates')

    subClient.on('message', async (channel, message) => {
      const data = JSON.parse(message)

      switch (channel) {
        case 'match:updates':
          await this.handleMatchUpdate(data)
          break
        case 'odds:updates':
          await this.handleOddsUpdate(data)
          break
        case 'bet:updates':
          await this.handleBetUpdate(data)
          break
      }
    })
  }

  private async handleMatchUpdate(data: any) {
    const { matchId, ...update } = data

    // Broadcast to all clients watching this match
    this.io.to(`match:${matchId}`).emit('match-update', update)
  }

  private async handleOddsUpdate(data: any) {
    const { matchId, odds } = data

    // Broadcast new odds to match watchers
    this.io.to(`match:${matchId}`).emit('odds-update', odds)
  }

  private async handleBetUpdate(data: any) {
    const { userId, bet } = data

    // Send bet confirmation to specific user
    this.io.to(`user:${userId}`).emit('bet-placed', bet)
  }

  /**
   * Publish match update
   */
  async publishMatchUpdate(matchId: string, update: any) {
    await pubClient.publish(
      'match:updates',
      JSON.stringify({ matchId, ...update })
    )
  }

  /**
   * Publish odds update
   */
  async publishOddsUpdate(matchId: string, odds: any) {
    await pubClient.publish(
      'odds:updates',
      JSON.stringify({ matchId, odds })
    )
  }

  /**
   * Publish bet update
   */
  async publishBetUpdate(userId: string, bet: any) {
    await pubClient.publish(
      'bet:updates',
      JSON.stringify({ userId, bet })
    )
  }
}
```

### Step 4: Create Socket.io API Route
File: `src/app/api/socket/route.ts`
```typescript
import { NextApiRequest } from 'next'
import { NextApiResponseServerIO } from '@/types/socket'
import { WebSocketServer } from '@/lib/websocket/server'

let io: any = null

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.io server...')
    
    const httpServer = res.socket.server as any
    io = new WebSocketServer(httpServer)
    
    res.socket.server.io = io
  }

  res.end()
}
```

---

## Task 4.2: Frontend WebSocket Integration

### Step 1: Create WebSocket Hook
File: `src/hooks/useWebSocket.ts`
```typescript
import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

export function useWebSocket(userId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_APP_URL || '', {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
    })

    socketInstance.on('connect', () => {
      console.log('WebSocket connected')
      setIsConnected(true)

      // Authenticate if userId provided
      if (userId) {
        socketInstance.emit('authenticate', userId)
      }
    })

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
    })

    socketRef.current = socketInstance
    setSocket(socketInstance)

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [userId])

  return { socket, isConnected }
}
```

### Step 2: Create Match Subscription Hook
File: `src/hooks/useMatchSubscription.ts`
```typescript
import { useEffect, useState } from 'react'
import { useWebSocket } from './useWebSocket'

export function useMatchSubscription(matchId: string, userId?: string) {
  const { socket, isConnected } = useWebSocket(userId)
  const [matchData, setMatchData] = useState<any>(null)
  const [odds, setOdds] = useState<any[]>([])
  const [recentBet, setRecentBet] = useState<any>(null)

  useEffect(() => {
    if (!socket || !isConnected || !matchId) return

    // Join match room
    socket.emit('join-match', matchId)

    // Listen for match state
    socket.on('match-state', (data) => {
      setMatchData(data)
    })

    // Listen for match updates
    socket.on('match-update', (update) => {
      setMatchData((prev: any) => (prev ? { ...prev, ...update } : update))
    })

    // Listen for odds updates
    socket.on('odds-update', (newOdds) => {
      setOdds(newOdds)
    })

    // Listen for bet confirmations
    socket.on('bet-placed', (bet) => {
      setRecentBet(bet)
    })

    return () => {
      socket.emit('leave-match', matchId)
      socket.off('match-state')
      socket.off('match-update')
      socket.off('odds-update')
      socket.off('bet-placed')
    }
  }, [socket, isConnected, matchId])

  return {
    matchData,
    odds,
    recentBet,
    isConnected,
  }
}
```

### Step 3: Create Real-time Match Component
File: `src/components/matches/LiveMatch.tsx`
```typescript
'use client'

import { useMatchSubscription } from '@/hooks/useMatchSubscription'
import { useAuth } from '@clerk/nextjs'
import { BetSlip } from './BetSlip'

interface LiveMatchProps {
  matchId: string
}

export function LiveMatch({ matchId }: LiveMatchProps) {
  const { userId } = useAuth()
  const { matchData, odds, recentBet, isConnected } = useMatchSubscription(
    matchId,
    userId || undefined
  )

  if (!matchData) {
    return <div>Loading match data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="text-sm text-gray-600">
          {isConnected ? 'Live' : 'Disconnected'}
        </span>
      </div>

      {/* Match Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div className="text-center flex-1">
            <img
              src={matchData.player1.imageUrl || '/default-player.png'}
              alt={matchData.player1.name}
              className="w-20 h-20 rounded-full mx-auto mb-2"
            />
            <h3 className="font-bold">{matchData.player1.name}</h3>
            <p className="text-gray-600">Rating: {matchData.player1.rating}</p>
          </div>

          <div className="text-center px-8">
            <div className="text-sm text-gray-600 mb-2">
              {matchData.game.name}
            </div>
            {matchData.status === 'LIVE' && (
              <div className="text-3xl font-bold">
                {matchData.player1Score || 0} - {matchData.player2Score || 0}
              </div>
            )}
            <div className="text-sm text-gray-600 mt-2">
              Best of {matchData.bestOf}
            </div>
          </div>

          <div className="text-center flex-1">
            <img
              src={matchData.player2.imageUrl || '/default-player.png'}
              alt={matchData.player2.name}
              className="w-20 h-20 rounded-full mx-auto mb-2"
            />
            <h3 className="font-bold">{matchData.player2.name}</h3>
            <p className="text-gray-600">Rating: {matchData.player2.rating}</p>
          </div>
        </div>
      </div>

      {/* Odds and Betting */}
      {odds.length > 0 && matchData.status === 'SCHEDULED' && (
        <BetSlip matchId={matchId} matchData={matchData} odds={odds} />
      )}

      {/* Recent Bet Notification */}
      {recentBet && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg">
          <p className="font-bold">Bet Placed!</p>
          <p>Amount: ${recentBet.amount}</p>
          <p>Potential Payout: ${recentBet.potentialPayout}</p>
        </div>
      )}
    </div>
  )
}
```

---

## Task 4.3: Real-time Odds Updates

### Step 1: Update Bet Placement to Trigger Odds Updates
File: `src/app/api/bets/place/route.ts` (add to existing)
```typescript
// Add after bet placement
import { pubClient } from '@/lib/redis/client'

// ... existing bet placement code ...

// After odds update
const updatedOdds = await oddsService.getMatchOdds(data.matchId)
await pubClient.publish(
  'odds:updates',
  JSON.stringify({ matchId: data.matchId, odds: updatedOdds })
)

// Notify user
await pubClient.publish(
  'bet:updates',
  JSON.stringify({ userId: user.id, bet })
)
```

### Step 2: Create Odds Display Component
File: `src/components/betting/OddsDisplay.tsx`
```typescript
'use client'

import { useState, useEffect } from 'react'

interface OddsDisplayProps {
  odds: any[]
  onSelectOdds: (odds: any) => void
}

export function OddsDisplay({ odds, onSelectOdds }: OddsDisplayProps) {
  const [previousOdds, setPreviousOdds] = useState<Map<string, number>>(
    new Map()
  )
  const [oddsChanges, setOddsChanges] = useState<Map<string, 'up' | 'down'>>(
    new Map()
  )

  useEffect(() => {
    const changes = new Map<string, 'up' | 'down'>()

    odds.forEach((odd) => {
      const key = `${odd.selection}-${odd.betType}`
      const prevOdds = previousOdds.get(key)

      if (prevOdds !== undefined) {
        const currentOdds = Number(odd.decimalOdds)
        if (currentOdds > prevOdds) {
          changes.set(key, 'up')
        } else if (currentOdds < prevOdds) {
          changes.set(key, 'down')
        }
      }

      previousOdds.set(key, Number(odd.decimalOdds))
    })

    setOddsChanges(changes)
    setPreviousOdds(new Map(previousOdds))

    // Clear change indicators after 2 seconds
    const timeout = setTimeout(() => {
      setOddsChanges(new Map())
    }, 2000)

    return () => clearTimeout(timeout)
  }, [odds])

  const moneylineOdds = odds.filter((o) => o.betType === 'MONEYLINE')

  return (
    <div className="grid grid-cols-2 gap-4">
      {moneylineOdds.map((odd) => {
        const key = `${odd.selection}-${odd.betType}`
        const change = oddsChanges.get(key)

        return (
          <button
            key={odd.id}
            onClick={() => onSelectOdds(odd)}
            className={`
              p-4 rounded-lg border-2 transition-all
              ${
                change === 'up'
                  ? 'border-green-500 bg-green-50'
                  : change === 'down'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 hover:border-blue-500'
              }
            `}
          >
            <div className="text-lg font-bold">
              {Number(odd.decimalOdds).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">
              {odd.americanOdds > 0 ? '+' : ''}
              {odd.americanOdds}
            </div>
            {change && (
              <div
                className={`text-xs ${
                  change === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {change === 'up' ? '↑' : '↓'}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
```

---

# PHASE 5: MOBILE OPTIMIZATION & POLISH (Weeks 15-16)

## Task 5.1: Mobile-First UI Components

### Step 1: Create Mobile-Optimized Match Card
File: `src/components/matches/MatchCard.tsx`
```typescript
'use client'

import Link from 'next/link'
import { format } from 'date-fns'

interface MatchCardProps {
  match: any
}

export function MatchCard({ match }: MatchCardProps) {
  const isLive = match.status === 'LIVE'

  return (
    <Link href={`/matches/${match.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-600">
            {match.game.name}
          </span>
          {isLive && (
            <span className="flex items-center gap-1 text-xs font-bold text-red-600">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              LIVE
            </span>
          )}
        </div>

        {/* Players */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <img
                src={match.player1.imageUrl || '/default-player.png'}
                alt={match.player1.name}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <div className="font-semibold text-sm">{match.player1.name}</div>
                <div className="text-xs text-gray-500">
                  {match.player1.rating}
                </div>
              </div>
            </div>
            {isLive && (
              <div className="text-xl font-bold">{match.player1Score || 0}</div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <img
                src={match.player2.imageUrl || '/default-player.png'}
                alt={match.player2.name}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <div className="font-semibold text-sm">{match.player2.name}</div>
                <div className="text-xs text-gray-500">
                  {match.player2.rating}
                </div>
              </div>
            </div>
            {isLive && (
              <div className="text-xl font-bold">{match.player2Score || 0}</div>
            )}
          </div>
        </div>

        {/* Time and Details */}
        <div className="mt-3 pt-3 border-t text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>{format(new Date(match.scheduledAt), 'MMM d, h:mm a')}</span>
            {match.round && <span>{match.round}</span>}
          </div>
        </div>
      </div>
    </Link>
  )
}
```

### Step 2: Create Touch-Optimized Bet Slip
File: `src/components/betting/MobileBetSlip.tsx`
```typescript
'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'

interface MobileBetSlipProps {
  selectedOdds: any
  onPlaceBet: (amount: number) => Promise<void>
  onClose: () => void
}

export function MobileBetSlip({
  selectedOdds,
  onPlaceBet,
  onClose,
}: MobileBetSlipProps) {
  const [amount, setAmount] = useState<number>(10)
  const [isPlacing, setIsPlacing] = useState(false)

  const quickAmounts = [5, 10, 25, 50, 100]
  const potentialPayout = amount * Number(selectedOdds.decimalOdds)
  const potentialProfit = potentialPayout - amount

  const handlePlaceBet = async () => {
    if (amount < 1) {
      toast.error('Minimum bet is $1')
      return
    }

    setIsPlacing(true)
    try {
      await onPlaceBet(amount)
      toast.success('Bet placed successfully!')
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to place bet')
    } finally {
      setIsPlacing(false)
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl z-50 p-6 animate-slide-up">
      {/* Handle Bar */}
      <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>

      <h3 className="text-lg font-bold mb-4">Place Your Bet</h3>

      {/* Selected Odds Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="text-sm text-gray-600 mb-1">Odds</div>
        <div className="text-2xl font-bold">
          {Number(selectedOdds.decimalOdds).toFixed(2)}
        </div>
        <div className="text-sm text-gray-600">
          {selectedOdds.americanOdds > 0 ? '+' : ''}
          {selectedOdds.americanOdds}
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bet Amount
        </label>
        <div className="grid grid-cols-5 gap-2 mb-3">
          {quickAmounts.map((quick) => (
            <button
              key={quick}
              onClick={() => setAmount(quick)}
              className={`
                py-2 px-3 rounded-lg border-2 font-medium transition-all
                ${
                  amount === quick
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }
              `}
            >
              ${quick}
            </button>
          ))}
        </div>

        {/* Custom Amount Input */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            $
          </span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={1}
            max={1000}
            className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Payout Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Potential Payout</span>
          <span className="text-xl font-bold text-blue-700">
            ${potentialPayout.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Potential Profit</span>
          <span className="text-lg font-semibold text-green-600">
            ${potentialProfit.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Place Bet Button */}
      <button
        onClick={handlePlaceBet}
        disabled={isPlacing || amount < 1}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isPlacing ? 'Placing Bet...' : `Place Bet - $${amount}`}
      </button>
    </div>
  )
}
```

---

## Task 5.2: Progressive Web App (PWA) Setup

### Step 1: Install PWA Dependencies
```bash
npm install next-pwa
```

### Step 2: Configure PWA
File: `next.config.js`
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

module.exports = withPWA({
  // Your existing Next.js config
})
```

### Step 3: Create Web App Manifest
File: `public/manifest.json`
```json
{
  "name": "FGC Betting Platform",
  "short_name": "FGC Bet",
  "description": "Real-time betting on fighting game esports",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Step 4: Add Manifest to Layout
File: `src/app/layout.tsx` (add to head)
```typescript
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#3b82f6" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="FGC Bet" />
```

---

## Task 5.3: Performance Optimization

### Step 1: Add Loading States
File: `src/components/ui/LoadingSpinner.tsx`
```typescript
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )
}
```

### Step 2: Implement Skeleton Loaders
File: `src/components/ui/MatchSkeleton.tsx`
```typescript
export function MatchSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-4 w-20 bg-gray-200 rounded" />
        <div className="h-4 w-12 bg-gray-200 rounded" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Step 3: Add React Query for Data Fetching
```bash
npm install @tanstack/react-query
```

File: `src/app/providers.tsx`
```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="top-center" />
      </QueryClientProvider>
    </ClerkProvider>
  )
}
```

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment Tasks
- [ ] Set up production database (PostgreSQL on Railway/Supabase)
- [ ] Set up production Redis (Upstash or Redis Cloud)
- [ ] Configure all environment variables
- [ ] Set up Clerk production instance
- [ ] Set up Stripe production account
- [ ] Configure start.gg API key
- [ ] Set up error tracking (Sentry)
- [ ] Set up logging (Logtail or similar)
- [ ] Run security audit on dependencies
- [ ] Set up SSL certificates
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Create admin accounts
- [ ] Load initial game and player data
- [ ] Test payment flows end-to-end
- [ ] Test bet placement and settlement
- [ ] Load test WebSocket connections
- [ ] Set up monitoring and alerts

### Legal Requirements
- [ ] Obtain gambling licenses (jurisdiction-specific)
- [ ] Implement age verification (18+/21+)
- [ ] Set up KYC/AML processes
- [ ] Create terms of service
- [ ] Create privacy policy
- [ ] Implement responsible gambling features
- [ ] Set up geo-blocking for restricted regions
- [ ] Configure withdrawal verification
- [ ] Set up fraud detection
- [ ] Implement deposit limits
- [ ] Add self-exclusion functionality

### Post-Deployment
- [ ] Monitor error rates
- [ ] Monitor WebSocket connections
- [ ] Monitor database performance
- [ ] Monitor API response times
- [ ] Set up user analytics
- [ ] Set up betting analytics
- [ ] Create admin dashboard for monitoring
- [ ] Document API endpoints
- [ ] Create user documentation
- [ ] Set up customer support system

---

## TESTING STRATEGY

### Unit Tests
```bash
npm install -D jest @testing-library/react @testing-library/jest-dom
```

Create test for odds calculator:
```typescript
// src/lib/betting/__tests__/odds-calculator.test.ts
import { OddsCalculator } from '../odds-calculator'

describe('OddsCalculator', () => {
  const calculator = new OddsCalculator()

  test('calculates win probability correctly', () => {
    const result = calculator.calculateWinProbability(
      { rating: 1600, gamesWon: 10, gamesLost: 5 },
      { rating: 1500, gamesWon: 8, gamesLost: 7 }
    )

    expect(result.player1WinProb).toBeGreaterThan(0.5)
    expect(result.player2WinProb).toBeLessThan(0.5)
    expect(result.player1WinProb + result.player2WinProb).toBeCloseTo(1)
  })

  test('converts probability to decimal odds', () => {
    const odds = calculator.convertToDecimalOdds(0.5)
    expect(odds).toBeGreaterThan(1)
  })

  test('calculates payout correctly', () => {
    const payout = calculator.calculatePayout(100, 2.5)
    expect(payout).toBe(250)
  })
})
```

### Integration Tests
Test critical flows:
- User registration and wallet creation
- Bet placement and wallet deduction
- Match settlement and payout
- WebSocket connections

### Load Testing
```bash
npm install -D artillery
```

Create load test config:
```yaml
# load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: 'Browse matches and place bet'
    flow:
      - get:
          url: '/api/matches'
      - post:
          url: '/api/bets/place'
          json:
            matchId: '{{ matchId }}'
            betType: 'MONEYLINE'
            selection: '{{ playerId }}'
            amount: 10
```

---

## MAINTENANCE AND MONITORING

### Database Maintenance
```sql
-- Create indexes for performance
CREATE INDEX idx_bets_user_status ON bets(user_id, status);
CREATE INDEX idx_bets_match_status ON bets(match_id, status);
CREATE INDEX idx_transactions_user_created ON transactions(user_id, created_at);
CREATE INDEX idx_matches_status_scheduled ON matches(status, scheduled_at);

-- Vacuum and analyze regularly
VACUUM ANALYZE;
```

### Monitoring Queries
```typescript
// Check system health
export async function getSystemHealth() {
  const [
    userCount,
    activeMatches,
    pendingBets,
    todayVolume,
  ] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.match.count({ where: { status: 'LIVE' } }),
    prisma.bet.count({ where: { status: 'PENDING' } }),
    prisma.bet.aggregate({
      where: {
        placedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      _sum: { amount: true },
    }),
  ])

  return {
    userCount,
    activeMatches,
    pendingBets,
    todayVolume: todayVolume._sum.amount,
  }
}
```

---

## NOTES FOR LLM EXECUTION

When implementing this plan:

1. **Execute phases sequentially** - Each phase builds on the previous
2. **Test after each major task** - Don't move forward with failing tests
3. **Use TypeScript strictly** - No `any` types in production code
4. **Follow security best practices**:
   - Validate all inputs with Zod
   - Use parameterized queries (Prisma handles this)
   - Implement rate limiting
   - Hash sensitive data
5. **Error handling patterns**:
   - Use try-catch blocks
   - Return meaningful error messages
   - Log errors appropriately
6. **Database transactions**: Use Prisma transactions for multi-step operations
7. **API responses**: Always return JSON with consistent structure
8. **Authentication**: Check auth on every protected route
9. **Real-time updates**: Use Redis pub/sub for scalability
10. **Mobile-first**: Design for mobile, enhance for desktop

### Common Pitfalls to Avoid
- Don't forget to handle edge cases in bet settlement
- Always lock bets before match starts
- Handle race conditions in wallet transactions
- Validate odds before accepting bets
- Implement proper error boundaries
- Add loading states for all async operations
- Test WebSocket reconnection logic
- Implement proper cleanup in useEffect hooks

### Performance Considerations
- Use database indexes appropriately
- Implement pagination for large lists
- Use Redis for frequently accessed data
- Optimize images and assets
- Implement lazy loading
- Use React.memo for expensive components
- Debounce search and filter inputs

This plan provides a complete roadmap for building a production-ready esports betting platform. Execute each task methodically and test thoroughly at each step.