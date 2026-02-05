# Decisions

This file captures key architectural and product decisions for this repo.

## API Surface
- All app data access goes through **tRPC** at `/api/trpc`.
- No REST endpoints for core app data (matches, bets, wallet, admin).

## Auth
- Authentication is handled by **Clerk** (`@clerk/nextjs`).
- Admin authorization is derived from Clerk public metadata: `role === 'admin'`.
- If a Clerk user exists without a DB row, the app creates one on first access.

## Database
- Database is **Postgres** accessed via **Prisma**.
- Prisma Decimal values are serialized to numbers before returning to clients.
- Wallet and betting operations are transaction-based for atomicity.

## Realtime
- Realtime updates are delivered via **SSE**.
- Redis pub/sub is optional; in-memory fallback is required when Redis is unavailable.

## UI
- **Use shadcn/ui components whenever possible before creating bespoke UI.**

## Product Scope
- Currency is fictional chips only; no real money or payments.
- Betting is currently moneyline-focused (other bet types are modeled but not fully supported).

## Packaging
- Shared database client and schema live in `packages/database`.
- Shared UI components live in `packages/ui`.