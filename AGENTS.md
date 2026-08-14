# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 16 App Router portfolio. Route pages and layouts live in
`app/`; public-facing routes are grouped under `app/(root)/`, dynamic segments
use folders such as `[slug]`, and API handlers live in `app/api/`. Reusable UI
is organized under `components/`: keep primitives in `ui/`, shared site pieces
in `common/`, and feature components in folders such as `projects/` or `blogs/`.
Typed portfolio data belongs in `config/`, blog posts are loaded from Notion,
and shared logic lives in `lib/`, `hooks/`, or `providers/`. Put URL-served
images in `public/`; local font files are in `assets/fonts/`.

## Build, Test, and Development Commands

- `pnpm install --frozen-lockfile` installs the exact dependencies recorded in
  `pnpm-lock.yaml`.
- `pnpm dev` starts the local development server at `http://localhost:3000`.
- `pnpm lint` runs the Next.js, React, and React Hooks ESLint rules.
- `pnpm build` creates a production build and catches integration/type errors.
- `pnpm start` serves the completed production build.
- `pnpm exec prettier --check .` checks formatting without modifying files.

## Coding Style & Naming Conventions

Write strict TypeScript and prefer the `@/` alias for repository-root imports.
Prettier is authoritative: two-space indentation, 80-column lines, double
quotes, no semicolons, ES5 trailing commas, and automatically organized imports.
Use kebab-case filenames (`project-card.tsx`), PascalCase React components and
types, camelCase functions and variables, and `useX` names for hooks. Components
are Server Components by default; add `"use client"` only when browser APIs,
state, or event handlers require it.

## Testing Guidelines

No automated test framework or coverage threshold is configured. Before every
PR, run `pnpm lint` and `pnpm build`, then manually exercise affected
routes in development, including responsive layouts and both themes when UI is
changed. If adding tests, use `*.test.ts` or `*.test.tsx`, colocate them with the
tested module, and add the chosen runner to `package.json`.

## Configuration & Security

Copy `.env.copy` to a local environment file and provide the Google Forms,
Analytics, and resume values needed by your change. Never commit real secrets or
personal credentials. Keep browser-exposed variables limited to the
`NEXT_PUBLIC_` values intentionally safe for clients.

## Commit & Pull Request Guidelines

Follow the history's Conventional Commit style: `type(scope): summary`, for
example `feat(home): add contact section`. Keep commits focused; add a short
bullet body for multi-part changes. PRs should explain the scope, list validation
performed, link relevant issues, and include before/after screenshots for visual
changes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
