# Repo Map

## Root
- `package.json`: workspaces + turbo scripts
- `turbo.json`: task graph
- `bun.lock`: Bun lockfile
- `docs/`: project documentation (historical notes, architecture summaries)

## Apps
- `apps/web/`: Next.js app (App Router in `apps/web/app/`)
  - `app/`: routes, layouts, API handlers
  - `components/`: UI components
  - `lib/`: services, helpers, integrations
  - `server/`: tRPC routers and context

## Packages
- `packages/database/`: Prisma schema + client
  - `prisma/schema.prisma`: schema
- `packages/ui/`: shared React UI components
- `packages/config/`: shared tooling config
- `packages/tsconfig/`: shared TS configs