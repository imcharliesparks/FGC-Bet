# Gemini/Antigravity Configuration


Use `.ai/PROJECT_CONTEXT.md` as the single source of truth for this repo.
If you need role-specific guidance, see `.ai/agents/*`.

## Memory Instructions

When I ask you to "remember" something:
- Architectural decisions → add to `.ai/DECISIONS.md`
- Troubleshooting solutions → add to `.ai/TROUBLESHOOTING.md`
- New conventions → add to `.ai/CONVENTIONS.md`

## Available Workflows

- `/dev` - Start development server
- `/lint-check` - Run lint and type-check
- `/db-sync` - Sync Prisma schema to database
- `/add-shadcn` - Add a shadcn/ui component

## Knowledge Base (Slash Commands)

- `/context` → Read `.ai/PROJECT_CONTEXT.md`
- `/stack` → Read `.ai/STACK.md`
- `/arch` → Read `.ai/ARCHITECTURE.md`
- `/files` → Read `.ai/FILE_MAP.md`

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

- **Prime Directive**: Prefer minimal, conventional changes. Keep scope tight.
- Always run `bun run type-check` after code changes
- Use shadcn/ui components before creating custom UI
- Follow patterns in `.ai/CONVENTIONS.md`
- Validate tRPC inputs with Zod at router boundaries
- Reference `.ai/TROUBLESHOOTING.md` when debugging