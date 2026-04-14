# echoboard — working agreement

Notes for future Claude sessions on this repo. Keep short, update as things change.

## Stack snapshot

- Turborepo monorepo; `apps/web` is the Next.js App Router frontend; `apps/backend/` is the backend.
- UI primitives live in `packages/ui` (shadcn-style, Tailwind v4, `@workspace/ui/*` imports).
- Fonts: `next/font/google` (Geist + Geist Mono) wired in `apps/web/app/layout.tsx`. Do not re-add `@font-face` blocks or reference `/fonts/*.woff2`.

## Design system — non-negotiable

The design system is defined in `packages/ui/src/styles/globals.css`. Treat that file as the source of truth and only consume its tokens/utility classes. Do not introduce new colors, shadows, or typographic scales without updating `globals.css` first.

**Principles that must hold on every surface:**

1. **Three-layer hierarchy.** Primary / secondary / tertiary elements must be visually distinct. Quiet the secondary and tertiary layers via size and `text-muted-foreground*` opacity.
2. **Warm neutrals only.** Use the OKLCH tokens (`background`, `foreground`, `muted`, `border`, `sidebar*`). Never `zinc`, `slate`, `gray`, `cool-gray`, etc.
3. **Two font weights only.** `font-normal` (400) and `font-medium` (500). Never `font-semibold` / `font-bold`.
4. **Monospace for data.** Vote counts, MRR, dates, stats, IDs → `font-mono tabular-nums`.
5. **Teal is the only accent.** Status badges have their own semantic colors (review=purple, planned=blue, progress=amber, shipped=teal). Everything else is teal or neutral.
6. **No shadows, no gradients.** Flat surfaces. Depth comes from bg differentiation (card on background) and thin borders.
7. **Focus rings.** Every interactive element needs visible `focus-visible` styling (ring-2 ring-ring ring-offset-2 or the Button component's built-in treatment).

**Reuse the utility classes already defined in `globals.css`:** `status-badge` + `status-{review,planned,progress,shipped}`, `mrr-tag`, `vote-btn` + `vote-active`, `feedback-card`, `roadmap-col-header`, `filter-pill` + `filter-active`, `changelog-entry`, `empty-state*`, `scrollbar-thin`, `text-balance`, `tabular-nums`. Prefer these over reinventing them in JSX.

## Page structure — per-page component folders

Each page in `apps/web/app/**/page.tsx` must stay thin: imports and composition only. Break every page into section components and put them in `apps/web/components/<page-name>/`. The page file composes those components.

- Example (landing): `app/page.tsx` composes `components/landing/{nav,hero,pain-strip,product-demo,...}.tsx`.
- Any shared helpers specific to that page (e.g. `fade-in.tsx`, tab data, mocks) live in the same folder. Do not put page-specific components in `packages/ui`.
- Mark `"use client"` only on components that use hooks. Server-component siblings are promoted automatically when a client parent imports them.
- Prefer shadcn primitives from `@workspace/ui/components/*` (Button, Input, Tabs, Sheet, Card, etc.) over raw HTML where one exists.

## Plan before implementing

For anything beyond a trivial one-line fix, plan first — either in plan mode or by writing an explicit plan in-chat — and get user approval before making edits. Bundle exploration into the plan (what files, what tokens, what reusable components). Do not start coding from a loose description.

## Integrating external tools / SDKs

When the user asks to integrate an external tool (e.g. Neon, Prisma, Drizzle, Clerk, Stripe, Convex, Supabase, tRPC, Resend, etc.):

1. **Fetch the current docs first.** Use `WebFetch` / `WebSearch` against the tool's official documentation before writing any code. Do not rely on memory — SDKs and install commands drift quickly.
2. **Target the latest stable version.** Check the current major version and its install/setup flow. Mention the version you are targeting in the plan.
3. **Follow the vendor's recommended patterns** for the framework in use (Next.js App Router in `apps/web`, whatever `apps/backend/` runs). Prefer first-party integrations over community wrappers unless the user asks otherwise.
4. **Install via the workspace's package manager.** Check `package-lock.json` / `pnpm-lock.yaml` / `yarn.lock` before running install commands.
5. **Surface env vars and secrets explicitly** in the plan — never silently assume a `.env` var exists.

## Do not

- Commit unless the user asks.
- Add features, abstractions, or "future-proofing" the task did not request.
- Create docs/README files unless asked.
- Write comments that just describe what the code does.
