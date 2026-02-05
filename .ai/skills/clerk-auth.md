# Skill: Clerk Auth (Next.js)

## Web (Next.js)
- Use Clerk components/hooks from `@clerk/nextjs`.
- Server-side auth uses `auth()` and `currentUser()` from `@clerk/nextjs/server`.
- Admin access is derived from Clerk public metadata (`role === 'admin'`).

## Tips
- Ensure Clerk environment variables exist in `apps/web/.env`.
- Authenticated tRPC procedures should use `protectedProcedure` or `adminProcedure`.