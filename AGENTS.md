# AGENTS.md — pota documentation map

Root index for agents working in this repo. **Read
`documentation/AGENTS.md` first** — it is the canonical guide
(conventions, library semantics, commands, repository layout,
workflow). This file only maps where the Markdown lives.

## Canonical guide

- **`documentation/AGENTS.md`** — the shared source of truth for all
  AI tools: project conventions, library semantics (signals, JSX,
  reactivity), the commands table, repository layout, workflow, and
  change heuristics. Start here.

## Project readme

- `readme.md` — human-facing intro (philosophy, install, links); not
  agent guidance.

## Maintainer notes — `documentation/`

- `todo.md` — maintainer roadmap / scratch.
- `cheatsheet.md` — quick API cheatsheet.

Consumer breaking-change migrations are no longer a file here — they
live in the `breaking-changes` skill (see Claude Code config below).

## API docs — `documentation/content/**`

The docs-site source: one Markdown page per public export or guide
topic, each with `title` / `subpath` / `topic` / `desc` frontmatter.
Ships in the npm package; the gitignored `projects/docs` app renders
it into the site. Find a symbol's page by name — e.g. `signal.md`,
`components/Show.md`, `use/location.md`, `store/mutable.md`. The
`docs-review` skill keeps this tree accurate against source.

## Claude Code config — `.claude/`

- `CLAUDE.md` — Claude Code entry point; imports the canonical guide
  and holds only Claude-specific extras.
- `rules/*.md` — path-scoped rules, auto-loaded when a matching path
  is touched (each declares its own `paths`): `babel-preset`,
  `components-and-use`, `core-and-lib`, `doc-links`, `exports`,
  `jsx-and-types`, `props`, `release`.
- `skills/*/SKILL.md` — invocable skills: `pota` (write idiomatic
  pota), `docs-review` (resumable docs-review pass),
  `breaking-changes` (migrate an app across pota versions).
- `agents/*.md` — project subagents: `pota-babel`, `pota-jsx-types`,
  `pota-release-review`.

## Subsystem readmes

- `tools/readme.md` — the build / test utilities.
- `tools/test-runner/readme.md` — browser test-runner architecture.
- `tools/babel-preset/readme.md` — Babel-preset build tooling.
- `tests/readme.md` — the test plan.
- `typescript/readme.md` — the hand-maintained `.d.ts` surfaces.
- `tools/bench/results.md`, `tools/bench/results-short.md` — benchmark
  output (written by `npm run bench`).

---

Hand-maintained map. When you add, move, or remove a Markdown file
outside `documentation/content/`, update the matching entry here.
