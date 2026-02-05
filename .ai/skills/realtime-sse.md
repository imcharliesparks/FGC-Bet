# Skill: Realtime (SSE + Redis)

## Where it lives
- Event bus: `apps/web/lib/realtime/event-bus.ts`
- SSE endpoints: `apps/web/app/api/realtime/*`
- Client hooks: `apps/web/hooks/*`

## Patterns
- Redis is optional; keep in-memory fallback working.
- Publish small, serializable event payloads.
- Avoid server-only imports in client hooks.