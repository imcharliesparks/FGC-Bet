# Skill: Tailwind + shadcn/ui Patterns

## What it is
shadcn/ui is a set of copy-in UI components for Next.js + Tailwind.
In this repo, components are generated into the web app and imported from `@/components/ui/*`.

## Conventions
- Tailwind is the default styling system.
- Use `class-variance-authority` (`cva`) for variants and `cn()` for merging.
- Prefer composable primitives (`asChild` via Radix Slot) where present.
- **Use shadcn/ui components whenever possible before creating bespoke UI.**

## Where it lives
- `apps/web/components/ui/*`
- `apps/web/lib/utils.ts` (`cn()` helper)
- `apps/web/components.json` (shadcn/ui generator config)

## How to use a component
1. Check if it already exists in `apps/web/components/ui/`.
2. If missing, generate it from the web app root:
   - `cd apps/web`
   - `bunx --bun shadcn@latest add <component-name>`
3. Import from `@/components/ui/<component-name>`.

## Available components (CLI names)
- `accordion`
- `alert`
- `alert-dialog`
- `aspect-ratio`
- `avatar`
- `badge`
- `breadcrumb`
- `button`
- `button-group`
- `calendar`
- `card`
- `carousel`
- `chart`
- `checkbox`
- `collapsible`
- `combobox`
- `command`
- `context-menu`
- `data-table`
- `date-picker`
- `dialog`
- `drawer`
- `dropdown-menu`
- `empty`
- `field`
- `hover-card`
- `input`
- `input-group`
- `input-otp`
- `item`
- `kbd`
- `label`
- `menubar`
- `native-select`
- `navigation-menu`
- `pagination`
- `popover`
- `progress`
- `radio-group`
- `resizable`
- `scroll-area`
- `select`
- `separator`
- `sheet`
- `sidebar`
- `skeleton`
- `slider`
- `sonner`
- `spinner`
- `switch`
- `table`
- `tabs`
- `textarea`
- `toast`
- `toggle`
- `toggle-group`
- `tooltip`
- `typography`