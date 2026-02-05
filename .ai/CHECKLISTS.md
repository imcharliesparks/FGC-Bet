# Checklists

## Before you open a PR
- Run `bun run type-check` for the repo.
- Run `bun run lint` for the repo.
- If you touched build configs or shared packages, run `bun run build`.
- Verify no secrets were added (no `.env` changes committed).

## When adding or changing tRPC procedures
- Validate input with Zod at the router boundary.
- Keep auth/authorization checks explicit.
- Serialize Prisma Decimal fields before returning to clients.
- Add a minimal test or document manual verification if no test pattern exists.

## When changing Prisma schema
- Update `packages/database/prisma/schema.prisma`.
- Run `bun run db:push` and `bun run db:generate`.
- Check for required indexes and cascade rules.

## When adding UI components
- Reuse existing components where possible.
- Keep Tailwind styling consistent with the app.
- Avoid client components unless needed.