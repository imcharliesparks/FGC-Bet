# Conventions

## TypeScript
- Prefer `type` imports when possible.
- Keep runtime validation at boundaries using Zod.
- Avoid `any`; use Prisma and tRPC types.

## Imports & paths
- Web app uses `@/*` alias (configured in `apps/web/tsconfig.json`).
- `packages/ui` and `packages/database` must not import from app code.

## tRPC + API
- All app data access goes through tRPC (`/api/trpc`).
- Validate inputs with Zod at the router boundary.
- Convert Prisma Decimal values to numbers before returning to clients.

## UI (web)
- Tailwind-first styling.
- **Use shadcn/ui components whenever possible before creating bespoke UI.**
- Reuse existing components in `apps/web/components` and shared `packages/ui`.
- Use server components by default; add `'use client'` only when needed.

## Naming
- Files: `kebab-case` or Next conventions (`page.tsx`, `layout.tsx`).
- Components: `PascalCase`.
- Hooks: `useThing`.