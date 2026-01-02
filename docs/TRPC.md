# tRPC Guide

This project uses tRPC for all app data access. REST handlers for bets, matches, wallet, and admin have been removed in favor of the single `/api/trpc` endpoint.

## Server
- Context: built from Clerk (`auth`/`currentUser`), Prisma client, and the incoming `Request`. Missing DB user records are created on-the-fly with 10,000 chips to mirror `requireAuth`.
- Routers: `wallet`, `bets`, `matches`, `admin` (see `apps/web/server/trpc/routers`).
- Handler: App Router route `apps/web/app/api/trpc/[trpc]/route.ts` using `fetchRequestHandler` + superjson.

## Client
- Hooks: `import { api } from '@/lib/trpc/react'`.
  - Queries: `api.matches.available.useQuery()`, `api.matches.byId.useQuery({ id })`, `api.bets.list.useQuery({ status })`, `api.wallet.balance.useQuery()`, etc.
  - Mutations: `api.bets.place.useMutation()`, `api.admin.importTournament.useMutation()`, etc.
- Provider: `QueryProvider` wraps `api.Provider` + React Query with httpBatchLink + superjson (see `apps/web/components/providers/query-provider.tsx`).

## Examples
```tsx
// Client component
const { data, isLoading } = api.matches.available.useQuery()

const placeBet = api.bets.place.useMutation({
  onSuccess: () => {
    utils.matches.invalidate()
    utils.bets.invalidate()
    utils.wallet.invalidate()
  },
})
```

```ts
// Server-to-server (createCaller)
import { appRouter } from '@/server/trpc/routers'
import { createTRPCContext } from '@/server/trpc/context'

const ctx = await createTRPCContext({ req: new Request('http://localhost/api/trpc') })
const caller = appRouter.createCaller(ctx)
const matches = await caller.matches.available()
```

## Testing
- Smoke test lives at `apps/web/tests/trpc-smoke.test.ts` (`bun test`) to ensure router namespaces exist.
- For deeper tests, prefer `appRouter.createCaller` with a stubbed context and seeded test DB.

## Migration Notes
- Legacy REST routes for bets, matches, wallet, and admin were removed. If a consumer needs an HTTP surface, use tRPC callers server-side or add a thin HTTP wrapper that calls tRPC internally.
- Public feature links now point to `/api/trpc` instead of removed REST endpoints.
