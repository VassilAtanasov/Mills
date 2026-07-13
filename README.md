# Mills — Autonomous SDLC powered by Ivan

[![CI](https://github.com/VassilAtanasov/Mills/actions/workflows/ci.yml/badge.svg)](https://github.com/VassilAtanasov/Mills/actions/workflows/ci.yml)

**Play the game: [vassilatanasov.github.io/Mills](https://vassilatanasov.github.io/Mills/)**

This repository is an **autonomous software development lifecycle template** driven by
[Claude Code](https://claude.com/claude-code). The agent persona is called **Ivan**. It has
built a complete, browser-playable Nine Men's Morris game — the machinery here turns
requirements into professionally gated, tested, reviewed code with minimal human involvement.

## The lifecycle

```
/discover  →  /kickoff  →  /autopilot ( = /feature × N )
 you + Ivan     Ivan          Ivan alone
 collaborate    (asks only    (notifies you when done or stuck)
                if unclear)
```

| Phase | Command | Who | What happens |
|---|---|---|---|
| Discovery | `/discover` | You + Ivan | Guided interview: product idea → functionality → architecture. Produces `docs/REQUIREMENTS.md` and `docs/ARCHITECTURE.md`. |
| Kickoff | `/kickoff` | Ivan | Requirements → GitHub Issues backlog (acceptance criteria per feature) + Projects board. Pings you if anything is ambiguous. |
| Build | `/autopilot` | Ivan | Implements each issue: branch → code + tests → quality gate → adversarial code review → QA verification → PR → CI → merge. |
| Single item | `/feature` | Ivan | Same pipeline for exactly one issue. |

## Quality guarantees (why autonomous ≠ sloppy)

1. **`gate.ps1`** — one gate script: build (warnings-as-errors), unit tests, typecheck, lint. Run locally, by hooks, and by CI.
2. **Stop hook** — Ivan *cannot end a working turn* while the gate fails; the failure is fed back and he must fix it.
3. **Fresh-context review** — a read-only `code-reviewer` subagent reviews every diff with no memory of writing it; a `qa-verifier` subagent runs the real app against the issue's acceptance criteria.
4. **GitHub Actions CI** — the same gate re-runs on every PR; merge requires green.

## Monitoring

- **Projects board** — Kanban of Todo / In Progress / Done.
- **Issue timelines** — Ivan comments at every pipeline stage.
- **PRs + Actions tab** — full diffs and gate history.
- **Push notifications** — feature complete, pipeline stuck, clarification needed, or open questions awaiting your input.

## Layout

```
CLAUDE.md               Ivan's identity, standards, Definition of Done, Ivan project config
gate.ps1                the quality gate (auto-detects what exists)
docs/                   REQUIREMENTS.md + ARCHITECTURE.md (written during /discover)
.claude/settings.json   permissions + hooks wiring + ivan plugin enablement
.claude/hooks/          format-on-edit, gate-on-stop
.github/workflows/      ci.yml (the gate, on PRs and pushes to main) + deploy.yml (GitHub Pages, on push to main)
client/                 React + TypeScript (Vite) app — the game itself; no backend
```

The lifecycle skills (`/discover`, `/kickoff`, `/feature`, `/autopilot`, `/adopt`) and the
review agents (`code-reviewer`, `qa-verifier`) come from the reusable
[ivan-sdlc plugin](https://github.com/VassilAtanasov/ivan-sdlc), enabled for this project in
`.claude/settings.json`. Project-specific facts live in the `## Ivan project config` section
of `CLAUDE.md`.
