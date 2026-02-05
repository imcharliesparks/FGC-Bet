# Quality Gates

Run the narrowest checks that cover your change, then expand if needed.

## Before Committing (run in order)

1. `bun run type-check` - Must pass with no errors
2. `bun run lint` - Must pass with no errors
3. `bun run build` - Only if touching build configs or shared packages

## Web-only Changes

1. `bun --cwd apps/web lint`
2. `bun --cwd apps/web build`

## Database Changes

1. `bun run db:push` - Push schema to database
2. `bun run db:generate` - Regenerate Prisma client
3. Verify migrations don't break existing data

## Integration Verification

1. Start dev server: `bun run dev`
2. Open http://localhost:3000 and verify UI renders
3. Sign in with Clerk and test authenticated routes
4. Test the specific feature you modified

## tRPC Changes

1. Verify router is exported in `apps/web/server/trpc/routers/index.ts`
2. Test procedure via React Query hooks in the UI
3. Check Decimal serialization if returning Prisma values