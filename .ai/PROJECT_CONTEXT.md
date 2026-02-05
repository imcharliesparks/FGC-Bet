# Codex Context

## What this repo is
- A TypeScript monorepo managed by **Turborepo** with **Bun** as the package manager.
- A single product app in `apps/web` (Next.js App Router) plus shared packages in `packages/`.
- Betting platform for fighting game esports using fictional chips (no real money).

## Prime directive
- Prefer minimal, conventional changes that match the existing style.
- Keep changes scoped to the user’s request; avoid “drive-by” refactors.
- Maintain clear boundaries between app code and shared packages.

## Default assumptions
- TypeScript strict mode remains enabled.
- Runtime validation uses **Zod** (server input validation and shared contracts).
- Auth is **Clerk** (`@clerk/nextjs`).
- API access is **tRPC** via `/api/trpc`.
- Database is **Postgres** via **Prisma** (`packages/database`).
- Realtime is **SSE** with Redis pub/sub optional fallback.
- **UI should use shadcn/ui components whenever possible.**

## Where to make changes
- Web app UI and routes: `apps/web/app/*`
- Web app components: `apps/web/components/*`
- Web app services/helpers: `apps/web/lib/*`
- Web backend (tRPC routers/context): `apps/web/server/*`
- tRPC HTTP handler: `apps/web/app/api/trpc/[trpc]/route.ts`
- Database schema: `packages/database/prisma/schema.prisma`
- Shared UI package: `packages/ui/*`

## Guardrails
- Don’t commit `.env` files; use `.env.example` patterns per app/package.
- Don’t import server-only code into client components.
- Don’t import app code into `packages/ui` or `packages/database`.
- Convert Prisma Decimal values to numbers before sending to clients.

## Mobile app status
- There is no mobile app in this repo yet.
- Any mobile-related docs are placeholders for future React Native work.

> CONFIRMATION_KEY: "Unified Context Active"