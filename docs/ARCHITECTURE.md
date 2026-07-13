# Architecture

> Written collaboratively with Ivan during `/discover` (pass 3). Records the decisions, not just
> the diagram — future build-mode sessions follow this file.

## 1. Overview

Mills is a **pure client-side single-page app** — no backend, no database, no network calls at
play time. A framework-free TypeScript rules engine holds all Nine Men's Morris rule knowledge;
a React UI renders engine state and forwards player actions to it. The built static site is
published to GitHub Pages.

```
┌─────────────────────────── browser ───────────────────────────┐
│  React UI (components, useReducer)                             │
│      │  actions (place / move / capture / newGame / mode)      │
│      ▼                                                         │
│  Rules engine (pure TS, immutable GameState, no React imports) │
│      ▲                                                         │
│      │  getLegalActions / applyAction (public API only)        │
│  AI opponent (pure TS heuristic, second consumer of the engine)│
└────────────────────────────────────────────────────────────────┘
        built by Vite → static files → GitHub Pages (/Mills/)
```

## 2. Stack

- Frontend: React + TypeScript (Vite), `client/`
- Backend: **none** — the product is a static site (decision D-1)
- Data: none; game state is in-memory only (ephemeral by requirement)
- Tests: Vitest (engine unit tests + component tests), ESLint, `tsc --noEmit`
- Hosting target: GitHub Pages via GitHub Actions, base path `/Mills/`

## 3. Project layout

```
client/
  src/
    engine/        # rules engine: pure TS, zero React/DOM imports
      types.ts     #   GameState, Move, Phase, Player, rejection reasons
      board.ts     #   the 24-point graph: adjacency + mill lines (static data)
      engine.ts    #   createGame / getLegalActions / applyAction
      *.test.ts    #   engine tests live beside the code they test
    ai/            # computer opponent: pure TS, consumes ONLY the engine public API
      ai.ts        #   chooseAction(state, rng): Action — 1-ply tactical heuristic (D-10)
      ai.test.ts   #   behavior tests against constructed positions (FR-19)
    components/    # React components (Board, Point, StatusBar, GameOverDialog…)
    state/         # useReducer glue between UI events and engine calls
    styles/        # theme.css — design tokens (wood palette, shadows, motion timings)
    App.tsx
  package.json     # scripts: dev, build, typecheck, lint, test
.github/workflows/
  ci.yml           # quality gate (existing)
  deploy.yml       # build + publish to GitHub Pages on push to main
docs/              # this file + REQUIREMENTS.md
gate.ps1           # repo-wide quality gate (auto-detects client/)
```

## 4. Key decisions

- **D-1: No backend; deploy to GitHub Pages.** Considered: ASP.NET Core API with the engine in C#
  (the original repo intention). Chosen because: hotseat play on one device with ephemeral state
  needs no server for any requirement; a static site removes hosting cost, auth surface, and API
  plumbing, and gives a permanent public portfolio URL for free.
- **D-2: Rules engine as a pure, framework-free TypeScript module.** Considered: rule logic inside
  React components/hooks. Chosen because: the engine is the correctness-critical core and must be
  testable headlessly (REQUIREMENTS §5); zero React/DOM imports in `src/engine/` is an enforced
  boundary — the UI may only call the engine's public API (FR-7).
- **D-3: Immutable state transitions.** `applyAction(state, action)` returns either a new
  `GameState` or a structured rejection `{ reason }`; it never mutates. Chosen because: makes
  threefold-repetition detection (FR-6) a matter of hashing past states, makes tests trivial to
  arrange, and rules out aliasing bugs.
- **D-4: React `useReducer` for UI state; no external state library.** Considered: Redux, Zustand.
  Chosen because: the entire app state is one `GameState` plus transient selection state — a
  reducer wrapping engine calls covers it; anything more is résumé-driven.
- **D-5: Deploy with GitHub Actions to GitHub Pages.** `deploy.yml` builds with Vite
  (`base: '/Mills/'`) and publishes via `actions/deploy-pages` on every push to `main`. CI
  (`ci.yml`, the gate) remains the merge blocker; deploy runs after merge.
- **D-6: Board rendered as inline SVG; wooden look from vector/CSS primitives only.** Considered:
  HTML/CSS-positioned divs for points; bundled wood-grain raster textures. Chosen because: the
  board is a fixed 24-point graph of lines and circles that SVG expresses directly (crisp at any
  size, easy hit-targets, per-point state styling), and rendering the wood from layered gradients
  + SVG turbulence/noise filters + shadows keeps zero image assets and zero runtime fetches
  (REQUIREMENTS §5, FR-12) while avoiding the tiling/blur/licensing pitfalls of raster textures.
  Photoreal is a non-goal; the target is a tasteful warm-wood look.
- **D-7: Rich but purposeful motion via CSS transitions/animations, gated on
  `prefers-reduced-motion`.** Considered: no animation (prior non-goal); a JS animation library.
  Chosen because: placement/move/mill/capture transitions help players follow hotseat state
  changes (FR-14), and CSS transitions on SVG/DOM cover every case here without a library. A
  single `prefers-reduced-motion` media query disables/reduces all motion in one place.
- **D-8: Single crafted theme via CSS custom properties; no theme switcher.** Considered: light+
  dark with a toggle. Chosen because: one warm-wood theme is the decided design (FR-12) and a
  switcher is scope the portfolio piece does not need. Tokens still live in CSS variables so the
  palette is centralized and a theme could be added later without refactoring components.

- **D-9: The AI is a second consumer of the engine's public API — never a second rules
  implementation.** The AI module (`src/ai/`) selects among `getLegalActions(state)` and may use
  `applyAction` to preview outcomes; it contains zero legality logic of its own, so an engine fix
  automatically fixes the AI (FR-18). Like the engine, it imports no React/DOM (same ESLint
  boundary rule).
- **D-10: 1-ply tactical heuristic, single tuned level.** Considered: minimax + alpha-beta at
  fixed depth. Chosen (2026-07-13) because: one beatable-but-sensible level is the decided product
  scope; a scored 1-ply choice with tactical priorities (complete own mill > block opponent's
  imminent mill > best positional score; capture targets ranked by damage to opponent mills and
  mobility) is fully unit-testable per behavior and keeps the module small. Ties between equally
  scored actions break uniformly at random via an **injected RNG** (`rng: () => number`), so
  gameplay varies but tests pass a seeded/stubbed RNG and stay deterministic. Deeper search is an
  explicit non-goal (REQUIREMENTS §6) — do not upgrade during build.
- **D-11: AI runs synchronously on the main thread; pacing lives in the UI layer.** Considered:
  Web Worker. Chosen because: scoring at most a few dozen legal actions on a 24-point board takes
  microseconds — there is nothing to offload, and worker bundling/message plumbing would be pure
  overhead. The ~0.5 s "thinking" pause (FR-20) is a UI-layer scheduling concern (e.g. a delayed
  dispatch in the reducer glue), NOT a sleep inside the AI module — `chooseAction` stays a pure
  synchronous function.

## 5. Cross-cutting conventions

- **Engine API shape**: `createGame(): GameState`; `getLegalActions(state): Action[]`;
  `applyAction(state, action): { ok: true; state: GameState } | { ok: false; reason: string }`.
  Rejection `reason` strings are player-readable — the UI shows them verbatim (FR-9).
- **Engine purity is enforced**: no imports from `react`, `react-dom`, or `src/components` inside
  `src/engine/` (ESLint `no-restricted-imports` rule). Engine functions are deterministic.
- **AI API shape**: `chooseAction(state: GameState, rng: () => number): Action` — synchronous,
  pure given `state` and `rng`, returns one of the engine's legal actions. The same purity ESLint
  boundary applies to `src/ai/`; additionally `src/engine/` must never import from `src/ai/`
  (the dependency is one-way: ai → engine).
- **Game modes in UI state**: the reducer holds `mode: 'vs-computer' | 'hotseat'` alongside
  `GameState`; the app initializes in `vs-computer` with the human as White. After a human action
  in vs-computer mode, the reducer glue schedules the AI turn (~0.5 s delay per FR-20/D-11) and
  dispatches the chosen action through the same path human actions use. Mode switch and rematch
  create a fresh game; rematch keeps the mode. In vs-computer mode, player-facing copy renders
  "You" / "Computer" in place of White / Black (FR-20).
- **Testing**: every engine behavior change ships Vitest tests beside the module. UI components
  get component tests for interaction logic (highlighting, forced capture flow), not for styling.
- **TypeScript**: `strict: true`; no `any` (use `unknown` + narrowing); discriminated unions for
  `Phase`, `Action`, and results — make illegal states unrepresentable in types too.
- **Starting the app** (qa-verifier): `cd client && npm install && npm run dev`, then open
  `http://localhost:5173/Mills/`. Production build check: `npm run build && npm run preview`.
- **Quality gate**: `./gate.ps1` at repo root runs typecheck, lint, build, and tests in `client/`.
  It is the same gate CI runs; green gate is a merge precondition. The build step catches
  production-build breaks (e.g. Rollup resolution failures) that `tsc --noEmit` alone would miss,
  before they reach the post-merge deploy workflow (D-5).

### Design conventions (build-mode Ivan must follow these)

- **Design tokens in CSS custom properties.** All colors, wood tones, radii, shadows, and motion
  durations/easings are defined once as CSS variables (e.g. `client/src/styles/theme.css`).
  Components reference tokens, never hard-coded hex or ms values — this keeps the wood palette and
  timing coherent and adjustable in one place.
- **Board is inline SVG.** `Board` renders the 24 points, connecting lines, and pieces as SVG.
  Wood tone comes from `<linearGradient>`/`<radialGradient>` and a subtle `<feTurbulence>` noise
  filter; pieces get bevel via gradients + `drop-shadow`. No `<img>`, no `url()` texture fetches.
- **Point state is data-driven styling.** Each point carries its state (empty / occupied-white /
  occupied-black / selected / legal-target / capturable / in-mill) and is styled from that — the
  UI reflects engine-reported legality (FR-9), it never recomputes rules to decide styling.
- **Player distinction is redundant (never color alone).** The two piece sets differ in shape or
  surface pattern in addition to tone, so they are distinguishable in grayscale (FR-13).
- **Accessibility baseline.** Every board point is a keyboard-focusable control with an ARIA name
  describing its position and state; focus is always visibly indicated; all controls (rematch,
  modal dismiss) are keyboard-operable.
- **Motion is centralized and reduced-motion-safe.** Transitions use the token durations/easings;
  a single `@media (prefers-reduced-motion: reduce)` block disables or shortens them. Motion is
  cosmetic only — game state is correct and playable with all animation removed.
- **Win moment.** On game end, highlight the deciding state, de-emphasize the board, and present a
  result modal (outcome + reason from the engine, plus rematch). No confetti/particle effects.
