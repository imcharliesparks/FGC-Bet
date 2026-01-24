# FGC Betting Platform - LLM Context

## Project Overview

**Name:** FGC Betting Platform  
**Type:** Full-stack esports betting application for Fighting Game Community (FGC) tournaments  
**Stage:** MVP Development  
**Target Market:** US-only, mid-sized audience  

### Core Purpose
A real-time betting platform for FGC tournaments (Street Fighter 6, Tekken 8, Guilty Gear Strive, etc.) that allows users to bet on professional fighting game matches using a fictional currency system ("chips").

### Current Scope (MVP)
- Fictional currency only (chips) - no real money yet
- No ID verification for MVP
- Web application (mobile-friendly Next.js)
- Manual match data entry with plans for start.gg API integration
- Focus on moneyline betting initially

## Technology Stack

### Core Framework
- **Frontend/Backend:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode)
- **Package Manager:** Bun
- **Monorepo Tool:** Turborepo

### Key Dependencies
- **UI Framework:** React 18+
- **Styling:** Tailwind CSS + ShadCN/ui components
- **Authentication:** Clerk
- **Database ORM:** Prisma
- **Database:** PostgreSQL
- **State Management:** React Query (TanStack Query) for server state
- **Validation:** Zod

### Future Considerations
- WebSockets for real-time odds updates (not yet implemented)
- Redis for caching and real-time data (not yet implemented)
- start.gg API integration for automated match data

## Monorepo Architecture

```
fgc-betting-platform/
├── apps/
│   └── web/                    # Next.js application
│       ├── src/
│       │   ├── app/            # Next.js App Router pages
│       │   ├── components/     # App-specific React components
│       │   └── lib/            # App-specific utilities
│       ├── public/             # Static assets
│       └── package.json
├── packages/
│   ├── database/               # Prisma schema and client
│   │   ├── schema.prisma       # Database schema
│   │   ├── index.ts            # Prisma client export
│   │   └── seed.ts             # Database seeding script
│   ├── ui/                     # Shared React components
│   │   ├── components/         # ShadCN components
│   │   ├── lib/                # Utility functions (cn, etc.)
│   │   └── index.tsx           # Component exports
│   ├── config/                 # Shared ESLint configs (future)
│   └── tsconfig/               # Shared TypeScript configs (future)
├── turbo.json                  # Turborepo configuration
└── package.json                # Root workspace config
```

### Package Dependencies
- `apps/web` depends on `@repo/database` and `@repo/ui`
- `@repo/ui` is framework-agnostic (exports React components)
- `@repo/database` exports Prisma client and all generated types

## Database Schema Overview

### Core Entities

**User**
- Fictional currency balance (chips)
- Clerk integration for authentication
- Betting history and preferences
- Default starting balance: 10,000 chips

**Tournament**
- Fighting game tournaments (e.g., Capcom Cup, EVO)
- Links to multiple matches
- Can be marked as featured
- Optional start.gg integration

**Player**
- Professional FGC players
- Stats tracking (wins, losses, ELO rating)
- Main character information
- Optional start.gg player ID

**Match**
- Individual sets between two players
- Part of a tournament
- Has multiple bets and odds snapshots
- Status: SCHEDULED, LIVE, COMPLETED, CANCELLED, POSTPONED

**Bet**
- User's wager on a specific match
- Locks in odds at placement time
- Types: MONEYLINE, HANDICAP, TOTAL_GAMES
- Status: PENDING, WON, LOST, CANCELLED, PUSHED

**OddsSnapshot**
- Historical record of odds changes
- Tracks betting volume
- American odds format (e.g., -150 for favorites, +200 for underdogs)

**Transaction**
- Audit trail for all chip movements
- Types: BET_PLACED, BET_WON, BET_LOST, BET_REFUND, ADMIN_ADJUSTMENT, DAILY_BONUS, WELCOME_BONUS

### Key Enums

**FightingGame**
- STREET_FIGHTER_6, TEKKEN_8, GUILTY_GEAR_STRIVE, MORTAL_KOMBAT_1, GRANBLUE_FANTASY_VERSUS, KING_OF_FIGHTERS_XV, UNDER_NIGHT, BLAZBLUE, DRAGON_BALL_FIGHTERZ, SKULLGIRLS, MULTIVERSUS, OTHER

**BetType**
- MONEYLINE: Pick the winner
- HANDICAP: Winner with game spread
- TOTAL_GAMES: Over/under total games in set

**BetSelection**
- PLAYER_1, PLAYER_2, OVER, UNDER

## Key Conventions & Patterns

### Code Organization
- **App Router:** All routes in `apps/web/src/app/`
- **Components:** Shared in `@repo/ui`, app-specific in `apps/web/src/components/`
- **Database Access:** Always use `prisma` from `@repo/database`, never instantiate new clients
- **Types:** Import Prisma-generated types from `@repo/database`, never redefine them

### Naming Conventions
- **Currency:** Always refer to fictional currency as "chips" (never "coins", "credits", "points")
- **Odds Format:** American odds (e.g., -150, +200) stored as Decimal(6,2)
- **Components:** PascalCase for React components
- **Files:** kebab-case for file names
- **Database:** snake_case for Prisma field names (auto-converts to camelCase in TypeScript)

### Design Patterns
- **Server Components:** Default to Server Components in Next.js, use 'use client' only when needed
- **Data Fetching:** Fetch data in Server Components, pass to Client Components as props
- **Form Actions:** Use Server Actions for mutations when possible
- **Error Handling:** Use error.tsx and not-found.tsx for error boundaries
- **Loading States:** Use loading.tsx for suspense boundaries

### Authentication Flow (Clerk)
- Public routes: `/`, `/matches`, `/tournaments`, `/sign-in`, `/sign-up`
- Protected routes: `/profile`, `/bets`, `/wallet`, admin pages
- Webhook endpoint: `/api/webhooks/clerk` to sync users to database
- User creation: Automatically creates User record with 10,000 starting chips

### Business Rules

**Betting Rules**
- Minimum bet: 10 chips (future implementation)
- Maximum bet: Based on user's chip balance
- Bets lock when match starts (bettingOpen = false)
- Odds locked at bet placement time (no retroactive changes)
- House edge: 5% built into odds calculations (future implementation)

**Match Management**
- Matches must have bettingOpen = true to accept bets
- Once match is LIVE, no new bets accepted
- Settlement is currently manual (future: automated via start.gg)
- Cancelled matches refund all bets (status = CANCELLED, bet status = PUSHED)

**Transaction Integrity**
- All bet placements wrapped in Prisma transactions
- Balance updates must be atomic with bet creation
- Transaction records created for audit trail

## Development Workflows

### Setup New Developer
```bash
# Clone and install
git clone <repo>
cd fgc-betting-platform
bun install

# Setup database
cp packages/database/.env.example packages/database/.env
cp apps/web/.env.example apps/web/.env
# Edit .env files with actual values

# Initialize database
bun db:push
bun db:generate
bun db:seed

# Start development
bun dev
```

### Common Commands
- `bun dev` - Start all apps in development mode
- `bun build` - Build all apps for production
- `bun db:push` - Push Prisma schema to database
- `bun db:generate` - Generate Prisma client
- `bun db:studio` - Open Prisma Studio (database GUI)
- `bun db:seed` - Seed database with sample data

### Adding New Features
1. **Database changes:** Update `packages/database/schema.prisma`, run `bun db:push`
2. **Shared components:** Add to `packages/ui/components/`, export from `index.tsx`
3. **New pages:** Add to `apps/web/src/app/` following App Router conventions
4. **API routes:** Add to `apps/web/src/app/api/` as route handlers

## Environment Variables

### Required for Development

**apps/web/.env**
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fgc_betting

# Clerk Webhook
WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Future Roadmap (Not Yet Implemented)

### Phase 1 (Current)
- ✅ Basic authentication with Clerk
- ✅ Database schema with Prisma
- ✅ Monorepo structure
- 🔄 Match listing pages
- 🔄 Betting interface
- 🔄 User wallet/balance display

### Phase 2
- Real-time odds updates (WebSockets)
- start.gg API integration
- Automated match settlement
- Admin dashboard for match management

### Phase 3
- Advanced bet types (handicap, over/under)
- Leaderboards and user stats
- Social features (following players/tournaments)
- Push notifications

### Phase 4 (Future)
- Real money integration (requires licensing)
- ID verification/KYC
- Multi-state compliance
- Payment processing (Stripe)

## Common Pitfalls & Gotchas

1. **Prisma Client Import:** Always import from `@repo/database`, never create new PrismaClient instances in app code
2. **Decimal Type:** Prisma returns Decimal objects for money fields - convert to number for display
3. **Server vs Client Components:** Don't import Prisma client in Client Components
4. **Clerk Webhooks:** Must be configured in Clerk dashboard to sync users properly
5. **Workspace Dependencies:** Use `workspace:*` in package.json for internal dependencies
6. **Turbo Cache:** If changes aren't reflected, try clearing turbo cache with `rm -rf .turbo`
7. **Bun Lockfile:** Commit `bun.lockb` to version control

## Testing Strategy (Not Yet Implemented)

Future considerations:
- Unit tests for betting logic and odds calculations
- Integration tests for API routes
- E2E tests for critical user flows (Playwright/Cypress)
- Database transaction testing

## Deployment (Not Yet Configured)

Planned deployment:
- **Frontend:** Vercel (Next.js native)
- **Database:** Supabase or Railway (PostgreSQL)
- **Environment:** Staging + Production environments
- **CI/CD:** GitHub Actions with Turbo caching

---

**Last Updated:** December 2024  
**Project Status:** Early MVP Development  
**Current Focus:** Core betting interface and match listing functionality