# Requirements

> Written collaboratively with Ivan during `/discover`. This file is the single source of product
> truth: `/kickoff` turns it into the GitHub Issues backlog.

## 1. Product goal

A complete, correct, browser-playable implementation of **Nine Men's Morris** (the mill game) for
two players sharing one device. It exists as the flagship exercise of the Mills autonomous SDLC
pipeline: the product must be a genuinely finished game — full official rules (placing, moving,
and flying phases; mill formation and captures; win and draw detection) — with a UI clear enough
that someone who has never played can complete a game without reading rules elsewhere. It is a
pure client-side web app (no backend) published on GitHub Pages. Engineering quality (a fully
tested rules engine, a clean engine/UI boundary, green quality gates) is a first-class goal,
because the codebase is the portfolio piece.

## 2. Target users

- **The developer (Vassil)** — primary user; the project is a portfolio/learning vehicle for
  autonomous development with Claude Code. Uses it to demonstrate and inspect the pipeline's output.
- **Two casual players at one device** — occasional hotseat sessions; may not know the rules, so
  the UI must teach through affordances (legal-move highlighting, phase indicators), not manuals.

## 3. Success criteria

- Two people can play a complete legal game from empty board to win/draw; no illegal state is
  reachable through the UI.
- Every rule path is covered by automated tests: mill formation (including double mills), capture
  restrictions (pieces in mills protected unless nothing else is available), the flying phase at
  three pieces, win by reduction below three pieces or by no legal moves.
- A first-time player can finish a game guided only by in-UI cues, without external instructions.
- Every feature ships through the full Ivan pipeline (gate, adversarial review, QA verification,
  PR, green CI) — the process itself is a success criterion.

## 4. Functional requirements

Rules engine (a pure TypeScript module, the single source of rule truth):

FR-1: A player can place a piece on any empty point during the placing phase, so that the game
can begin. Players alternate, nine pieces each.
  - Acceptance: placing on an occupied point is rejected; after all 18 placements the game
    transitions to the moving phase; the board is the standard 24-point mill board.

FR-2: A player who forms a mill (three own pieces on a connected line) must remove one opponent
piece, so that mills have their rule-defined consequence.
  - Acceptance: forming a mill (in any phase, including placing) requires a capture before the
    turn ends; a piece inside an opponent mill cannot be captured unless all opponent pieces are
    in mills; capturing a non-mill piece while free pieces exist elsewhere is allowed, capturing
    a mill piece in that situation is rejected; two mills formed by one move still yield exactly
    one capture.

FR-3: A player can move one of their pieces to an adjacent empty point during the moving phase,
so that the mid-game is played by the official rules.
  - Acceptance: moves to non-adjacent or occupied points are rejected; adjacency follows the
    standard board graph (no diagonals).

FR-4: A player reduced to exactly three pieces can move a piece to ANY empty point (flying), so
that the endgame follows the official rules.
  - Acceptance: flying is allowed only at exactly three pieces; the opponent (if above three)
    remains restricted to adjacent moves.

FR-5: The game detects a win, so that every game has a correct outcome.
  - Acceptance: a player loses when reduced below three pieces, or when they have no legal move
    on their turn; the game becomes immutable after the result is decided.

FR-6: The game detects a draw automatically, so that no game can stall forever.
  - Acceptance: draw on threefold repetition of the same position with the same player to move;
    draw after 50 consecutive moves in the moving/flying phases with no mill formed and no
    capture; both counters verified by tests.

Engine API:

FR-7: The UI can create a game, read its state, and submit moves only through the engine module's
public API, so that the engine is the sole referee.
  - Acceptance: every action is validated by the engine; an illegal action returns a structured
    rejection with a human-readable reason and leaves the state unchanged; game state is
    immutable — each accepted action returns a new state value; state lives in browser memory
    only (ephemeral by design).

UI:

FR-8: Players see the board and full game status at all times, so that the state is never
ambiguous.
  - Acceptance: the UI renders all 24 points and pieces, whose turn it is, the current phase,
    each player's pieces in hand and pieces captured.

FR-9: A player can act through guided interactions, so that a first-time player can play without
external instructions.
  - Acceptance: selecting a piece (or the placing phase itself) highlights all legal targets;
    after forming a mill the capturable opponent pieces are highlighted and a capture is required
    to proceed; attempting an illegal action shows the reason returned by the engine.

FR-10: Players can start and finish games without friction, so that hotseat play is instant.
  - Acceptance: opening the app (or one click) starts a fresh game; win or draw is announced with
    the reason (e.g. "White wins — Black has no legal moves"); a rematch button starts a new game
    in one click.

Deployment:

FR-11: Anyone can play the game at its public GitHub Pages URL, so that the portfolio piece is
one link away.
  - Acceptance: a GitHub Actions workflow builds the app and publishes it to GitHub Pages on
    every merge to `main`; the deployed app is fully functional at the Pages URL (asset paths
    respect the `/Mills/` base path).

Design & UX:

FR-12: The game presents a classic wooden board-game aesthetic, so that it feels like a real
tabletop game and reads as a polished portfolio piece.
  - Acceptance: the board and pieces render in a warm wooden visual language built entirely from
    CSS/SVG gradients, filters, and shadows — no image/texture files and no network fetches
    (respects the static-site / no-network constraint); pieces appear beveled/three-dimensional;
    a single well-crafted theme ships (no theme switcher).

FR-13: The two players are distinguishable by more than color, so that the game is playable by
colorblind users and legible in grayscale.
  - Acceptance: the two piece sets differ in shape or pattern as well as color (e.g. light vs dark
    stone plus a distinct surface mark), verifiably distinct when hue is removed; every board
    point exposes an accessible name/role (ARIA) reflecting its state; all interactive elements
    are reachable and operable by keyboard with a visible focus indicator.

FR-14: State changes are communicated through motion, so that players (especially first-timers)
can follow what just happened in hotseat play.
  - Acceptance: piece placement and movement animate; forming a mill visibly highlights the
    milled line; a captured piece animates out; when `prefers-reduced-motion` is set, animations
    are reduced or disabled and the game remains fully playable.

FR-15: The winning moment is clearly and elegantly presented, so that every game ends with an
unambiguous, satisfying conclusion.
  - Acceptance: on win, the deciding state is highlighted and the board de-emphasizes, then a
    result modal presents the outcome and reason (e.g. "White wins — Black has no legal moves")
    with a one-click rematch; on a draw, the modal states the draw reason. The modal is keyboard-
    dismissable and rematch is keyboard-operable.

FR-16: The layout adapts across screen sizes, so that hotseat players can use a desktop or pass a
tablet around.
  - Acceptance: the board is SVG and scales to the viewport without pixelation; the full layout
    (board plus status, pieces-in-hand, captured counts) is usable from tablet width (~768px) up
    to desktop with no horizontal scrolling and no overlapping controls.

## 5. Non-functional requirements

- Engine-authoritative rules: UI components never compute legality themselves — they render what
  the engine's API reports (state, legal targets, rejection reasons). There is exactly one rules
  implementation.
- Every rule path in FR-1…FR-6 is covered by Vitest unit tests against the engine directly (not
  through the UI).
- Ephemeral by design: game state lives in browser memory; refreshing the page losing the game is
  accepted. No authentication, no user data, no network calls at play time.
- Works in current desktop evergreen browsers; layout usable on a tablet-sized screen (hotseat
  players may pass a tablet around). No mobile-native support.
- Visual design is built from vector/CSS primitives only (gradients, SVG filters, shadows) — no
  bundled image assets and no runtime asset fetches, keeping the static bundle small and the
  no-network guarantee intact.
- Accessibility is a design constraint, not an afterthought: colorblind-safe player distinction,
  keyboard operability, visible focus, and ARIA state on board points (FR-13). `prefers-reduced-
  motion` is honored everywhere motion is used (FR-14).

## 6. Out of scope

- Any backend or server-side code — the product is a static site.
- AI / computer opponent.
- Online multiplayer, async play, spectating — any form of networking between players.
- Accounts, authentication, profiles, stats, rankings.
- Persistence of any kind: saved games, resume after restart, game history.
- Undo/redo.
- Move history panel, editable player names, phase-transition banner hints.
- Sound effects / audio of any kind (motion is visual only).
- Dark mode / theme switching — a single well-crafted warm-wood theme ships (FR-12).
- Bundled image or texture assets — the wooden look is rendered from CSS/SVG primitives (FR-12).
- Confetti / particle / arcade-style win effects — the win moment stays elegant (FR-15).
- Rule variants (Twelve Men's Morris, diagonal mills, alternative flying rules).

## 7. Open questions

None — all discovery questions were resolved on 2026-07-13.
