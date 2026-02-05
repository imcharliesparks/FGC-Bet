# Skill: tRPC (Next.js)

## Where it lives
- Handler: `apps/web/app/api/trpc/[trpc]/route.ts`
- Context: `apps/web/server/trpc/context.ts`
- Routers: `apps/web/server/trpc/routers/*`
- Client hooks: `apps/web/lib/trpc/react`

## Patterns
- Validate inputs with Zod at the router boundary.
- Use `publicProcedure`, `protectedProcedure`, and `adminProcedure` from `apps/web/server/trpc/trpc.ts`.
- Serialize Prisma Decimal values before returning to clients.

## When adding procedures
1. Add to the relevant router in `apps/web/server/trpc/routers/*`.
2. Ensure the router is exported in `apps/web/server/trpc/routers/index.ts`.
3. Use the generated client hooks in the UI.