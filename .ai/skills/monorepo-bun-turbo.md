# Skill: Bun + Turborepo

## Patterns
- Root scripts call Turbo (`bun run dev|build|lint|type-check`).
- Workspace scripts can be run via `bun --cwd <workspace> <script>`.

## When to use Turbo vs workspace script
- Use Turbo for repo-wide tasks.
- Use workspace scripts when debugging a single app quickly.

## Tips
- Prefer adding a script to a workspace `package.json` over bespoke one-off commands.
- If you change build outputs, update `turbo.json` outputs/inputs accordingly.