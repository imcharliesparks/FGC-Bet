# Environment & Secrets

## Rules
- Don’t commit `.env` files.
- Use existing `.env.example` files as the source of truth.

## Web (Next.js)
- File: `apps/web/.env`
- Required keys typically include:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
  - `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
  - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
  - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
  - `DATABASE_URL`
  - `CLERK_WEBHOOK_SECRET`
  - `STARTGG_API_KEY` (for admin import)
  - `REDIS_URL` and `REDIS_ENABLED` (optional)

## Database package
- File: `packages/database/.env`
- Requires `DATABASE_URL` for Prisma.

## Notes
- Redis is optional; the app falls back to in-memory event bus.
- `STARTGG_API_KEY` is required for tournament import.