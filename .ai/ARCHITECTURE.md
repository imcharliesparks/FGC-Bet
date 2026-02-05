# Architecture

## High-level data flow
1. Client UI (Next.js App Router) renders pages and calls tRPC via React Query.
2. tRPC handler at `/api/trpc` delegates to routers in `apps/web/server/trpc/routers`.
3. Routers call services in `apps/web/lib/*` and Prisma client from `packages/database`.
4. Database persists users, matches, bets, transactions, odds snapshots.
5. Realtime updates are published via `apps/web/lib/realtime/event-bus.ts` (Redis or in-memory), delivered to clients via SSE.

## Contract strategy
- Use Zod for input validation at tRPC boundaries.
- Use tRPC as the only HTTP API surface (no REST endpoints for app data).
- Serialize Prisma Decimal fields to numbers before returning to clients.

## Auth strategy
- Clerk handles authentication in Next.js.
- `apps/web/server/trpc/context.ts` creates user records on first auth.
- Admin access is derived from Clerk public metadata role (`role === 'admin'`).

## UI strategy
- **Use shadcn/ui components whenever possible before creating bespoke UI.**
- Reuse existing components from `apps/web/components` and `packages/ui`.

## Dependency boundaries
- `apps/web` may import from `packages/database` and `packages/ui`.
- `packages/database` must remain framework-agnostic.
- `packages/ui` must remain framework-agnostic.