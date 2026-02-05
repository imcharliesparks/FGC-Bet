# Troubleshooting

## Bun / workspaces
- If installs behave oddly, try: `bun install --force`.
- If a workspace script can't find deps, run from root or use `bun --cwd <path> <script>`.

## Prisma
- If Prisma client errors, run `bun run db:generate`.
- If schema changes are not reflected, run `bun run db:push` then `bun run db:generate`.

## tRPC
- If `UNAUTHORIZED`, confirm Clerk keys and that the user is signed in.
- If a router is missing, ensure it is exported from `apps/web/server/trpc/routers/index.ts`.

## Next.js
- If module resolution breaks, confirm `apps/web/tsconfig.json` `paths` includes `@/*`.
- If CSS is missing, confirm `apps/web/app/globals.css` is imported in `apps/web/app/layout.tsx`.

## Clerk
- Missing key errors usually mean `apps/web/.env` wasn’t created from `.env.example`.
- Admin access uses Clerk public metadata: `role: 'admin'`.

## Redis / Realtime
- If Redis is unavailable, the app falls back to in-memory events.
- Confirm `REDIS_ENABLED=true` and `REDIS_URL` when expecting Redis.