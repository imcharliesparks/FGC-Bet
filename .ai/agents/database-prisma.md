# Agent: Database (Prisma)

## Use this when
- Editing schema or seed data in `packages/database`

## Operating principles
- Schema changes must be reflected with `db:push` and `db:generate`.
- Add indexes for frequently filtered fields.
- Be deliberate with `onDelete` behavior.

## Common touchpoints
- Schema: `packages/database/prisma/schema.prisma`
- Seed: `packages/database/seed.ts`
- Client export: `packages/database/index.ts`

## Commands
- Push schema: `bun run db:push`
- Generate client: `bun run db:generate`
- Seed: `bun run db:seed`
- Studio: `bun run db:studio`