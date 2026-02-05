# Workflows

## Install
- `bun install`

## Dev (all workspaces)
- `bun run dev`

## Build
- `bun run build`

## Lint / Type-check
- `bun run lint`
- `bun run type-check`

## Database (Prisma)
- Generate client: `bun run db:generate`
- Push schema: `bun run db:push`
- Studio: `bun run db:studio`
- Seed: `bun run db:seed`

## Web app only
- Dev: `bun --cwd apps/web dev`
- Build: `bun --cwd apps/web build`
- Lint: `bun --cwd apps/web lint`

## Add a shadcn/ui component (preferred)
1. Check if it exists in `apps/web/components/ui/`.
2. If missing:
   - `cd apps/web`
   - `bunx --bun shadcn@latest add <component-name>`
3. Import from `@/components/ui/<component-name>`.

## Add a shared UI component
- Add to `packages/ui` and export via `packages/ui/index.ts`.