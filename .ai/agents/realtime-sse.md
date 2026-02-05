# Agent: Realtime (SSE + Redis)

## Use this when
- Working on realtime updates, SSE endpoints, or the event bus

## Operating principles
- Redis is optional; code must work with in-memory fallback.
- Keep event payloads small and serializable.

## Common touchpoints
- Event bus: `apps/web/lib/realtime/event-bus.ts`
- SSE routes: `apps/web/app/api/realtime/*`
- Client hooks: `apps/web/hooks/*`

## Commands
- Repo lint: `bun run lint`