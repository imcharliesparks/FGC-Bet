# File Map

A curated map of important files and entry points.

## App entry points
- `apps/web/app/layout.tsx`: Root layout, providers, global styles import
- `apps/web/app/page.tsx`: Landing page
- `apps/web/app/(dashboard)/layout.tsx`: Authenticated app shell

## tRPC
- `apps/web/app/api/trpc/[trpc]/route.ts`: tRPC HTTP handler
- `apps/web/server/trpc/trpc.ts`: tRPC init + middleware
- `apps/web/server/trpc/context.ts`: Request context (Clerk + Prisma + user)
- `apps/web/server/trpc/routers/index.ts`: Router composition
- `apps/web/server/trpc/routers/*.ts`: Feature routers

## Services
- `apps/web/lib/betting/*`: Betting engine, odds, settlement
- `apps/web/lib/wallet/service.ts`: Wallet operations
- `apps/web/lib/startgg/*`: start.gg integration + importer
- `apps/web/lib/realtime/event-bus.ts`: Realtime pub/sub abstraction
- `apps/web/lib/db/prisma.ts`: Prisma client access

## API routes (non-tRPC)
- `apps/web/app/api/realtime/*`: SSE endpoints
- `apps/web/app/api/webhooks/*`: Clerk webhooks

## UI
- `apps/web/components/*`: App-specific components
- `packages/ui/*`: Shared components
- `apps/web/app/globals.css`: Global styles

## Database
- `packages/database/prisma/schema.prisma`: Schema
- `packages/database/seed.ts`: Seed data
- `packages/database/index.ts`: Prisma client export

## Config
- `apps/web/next.config.ts`: Next.js config
- `apps/web/tailwind.config.ts`: Tailwind v4 config
- `apps/web/tsconfig.json`: TS config
- `turbo.json`: Turbo task graph
- `package.json`: Workspaces + scripts