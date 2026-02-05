# Claude Code Configuration

Use `.ai/PROJECT_CONTEXT.md` as the single source of truth for this repo.
If you need role-specific guidance, see `.ai/agents/*`.

## Memory Instructions

When I ask you to "remember" something:
- Architectural decisions → add to `.ai/DECISIONS.md`
- Troubleshooting solutions → add to `.ai/TROUBLESHOOTING.md`
- New conventions → add to `.ai/CONVENTIONS.md`

## Preferred Behaviors

- Always run `bun run type-check` after code changes
- Use shadcn/ui components before creating custom UI
- Follow patterns in `.ai/CONVENTIONS.md`
- Reference `.ai/TROUBLESHOOTING.md` when debugging
- Validate tRPC inputs with Zod at router boundaries
- Convert Prisma Decimal values to numbers before returning to clients

## Slash Command References

- `/context` → Read `.ai/PROJECT_CONTEXT.md`
- `/stack` → Read `.ai/STACK.md`
- `/arch` → Read `.ai/ARCHITECTURE.md`
- `/files` → Read `.ai/FILE_MAP.md`