# Quality Gates

Run the narrowest checks that cover your change, then expand if needed.

## Repo-wide
- `bun run type-check`
- `bun run lint`

## Build sanity
- `bun run build` (when changing build config or shared packages)

## Web-only
- `bun --cwd apps/web lint`
- `bun --cwd apps/web build`