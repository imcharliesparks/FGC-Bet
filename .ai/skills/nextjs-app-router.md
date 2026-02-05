# Skill: Next.js App Router

## Conventions
- Routes live under `apps/web/app/` (`page.tsx`, `layout.tsx`, route handlers).
- Global styles are imported in `apps/web/app/layout.tsx` from `apps/web/app/globals.css`.
- Use `@/*` alias for internal imports.

## UI composition
- Prefer server components; add `'use client'` only when needed.
- Reuse existing components in `apps/web/components` and `packages/ui`.