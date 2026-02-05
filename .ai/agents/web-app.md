# Agent: Web App (Next.js)

## Use this when
- Building pages/components in `apps/web/app` and `apps/web/components`
- Working on Tailwind styling and UI composition
- Updating Clerk-protected routes or layouts

## Operating principles
- Use server components by default; add `'use client'` only when needed.
- Keep routing and data fetching aligned with existing patterns in `apps/web/app`.
- Prefer tRPC hooks for app data (`@/lib/trpc/react`).
- **Use shadcn/ui components whenever possible before creating bespoke UI.**

## Common touchpoints
- Routes/layouts: `apps/web/app/*`
- Components: `apps/web/components/*`
- Client hooks: `apps/web/hooks/*`
- Providers: `apps/web/components/providers/*`

## Commands
- Dev: `bun --cwd apps/web dev`
- Build: `bun --cwd apps/web build`
- Lint: `bun --cwd apps/web lint`