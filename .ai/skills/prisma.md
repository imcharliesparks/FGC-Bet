# Skill: Prisma

## Where it lives
- Schema: `packages/database/prisma/schema.prisma`
- Client export: `packages/database/index.ts`

## Patterns
- Convert Prisma Decimal values to numbers before sending to clients.
- Use transactions for balance updates or multi-table writes.
- Add indexes for frequently filtered fields.

## Commands
- Push schema: `bun run db:push`
- Generate client: `bun run db:generate`
- Studio: `bun run db:studio`
- Seed: `bun run db:seed`