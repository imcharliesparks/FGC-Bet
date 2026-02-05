# Gemini/Antigravity Configuration

Use `.ai/PROJECT_CONTEXT.md` as the single source of truth for this repo.
If you need role-specific guidance, see `.ai/agents/*`.

## Available Workflows

- `/dev` - Start development server
- `/lint-check` - Run lint and type-check
- `/db-sync` - Sync Prisma schema to database
- `/add-shadcn` - Add a shadcn/ui component

## Role Guides

- Web UI: `.ai/agents/web-app.md`
- Backend/tRPC: `.ai/agents/server-backend.md`
- Database: `.ai/agents/database-prisma.md`
- Realtime: `.ai/agents/realtime-sse.md`

## Skills

- tRPC patterns: `.ai/skills/trpc.md`
- Tailwind + shadcn/ui: `.ai/skills/tailwind-ui.md`
- Prisma: `.ai/skills/prisma.md`
- Clerk Auth: `.ai/skills/clerk-auth.md`
- Zod contracts: `.ai/skills/zod-contracts.md`

## Preferred Behaviors

- Always run `bun run type-check` after code changes
- Use shadcn/ui components before creating custom UI
- Follow patterns in `.ai/CONVENTIONS.md`
- Validate tRPC inputs with Zod at router boundaries