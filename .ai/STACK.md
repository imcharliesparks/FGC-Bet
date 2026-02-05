# Tech Stack

## Monorepo tooling
- Package manager: **Bun** (`packageManager: bun@1.2.10`)
- Task runner: **Turborepo** (`turbo.json`)
- Formatting: **Prettier** (root dev dependency)

## Web app (`apps/web`)
- Framework: **Next.js 16.1.1** (App Router)
- UI: **React 19.2.3**, **Tailwind CSS v4**, **shadcn/ui** (preferred components)
- Auth: **@clerk/nextjs**
- API client: **tRPC** (`@trpc/react-query`)
- Data fetching/cache: **@tanstack/react-query**
- Validation: **Zod**

## Backend (within Next.js app)
- tRPC routers/context: `apps/web/server/*`
- API handler: `apps/web/app/api/trpc/[trpc]/route.ts`
- Database: **Postgres** with **Prisma** (`packages/database`)
- Realtime: **SSE** + **Redis** pub/sub (optional, in-memory fallback)
- External API: **start.gg** (GraphQL)

## Shared packages
- `packages/database`: Prisma schema + generated client
- `packages/ui`: shared React UI components