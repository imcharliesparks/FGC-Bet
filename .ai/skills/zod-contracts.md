# Skill: Zod Validation

## Recommended flow
- Define Zod schemas close to the tRPC procedure input.
- Validate inputs at the router boundary.
- Use Zod in shared utilities only when it provides reusable validation.

## Avoid
- Duplicating “the same type” separately in multiple places.
- Using TS-only types for values that need runtime validation.