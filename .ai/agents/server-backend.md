# Agent: Server Backend (tRPC + Services)

## Use this when
- Editing tRPC routers in `apps/web/server/trpc/routers`
- Updating request context in `apps/web/server/trpc/context.ts`
- Working on backend services in `apps/web/lib/*`

## Operating principles
- Validate input with Zod at the router boundary.
- Keep auth checks explicit (`protectedProcedure`, `adminProcedure`).
- Convert Prisma Decimal values to numbers before returning to clients.

## Common touchpoints
- Routers: `apps/web/server/trpc/routers/*`
- Context: `apps/web/server/trpc/context.ts`
- tRPC handler: `apps/web/app/api/trpc/[trpc]/route.ts`
- Services: `apps/web/lib/*`

## Commands
- Repo type-check: `bun run type-check`
- Repo lint: `bun run lint`