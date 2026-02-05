# Prompt: Add a tRPC procedure

Procedure:
- Router: <matches | bets | wallet | admin | new>
- Name: <procedure name>
- Auth: <public | protected | admin>

Contract:
- Input: <Zod schema>
- Output: <shape>
- Prisma Decimal fields: <list to serialize>

Implementation notes:
- Routers live in `apps/web/server/trpc/routers/*`.
- Export router from `apps/web/server/trpc/routers/index.ts`.
- Use `apps/web/lib/*` for non-trivial business logic.