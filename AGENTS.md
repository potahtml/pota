# AGENTS.md — pota documentation map

Index of the Markdown that guides agents, for two audiences. Working
**on** pota (this repository): read `documentation/AGENTS.md` first —
it is the canonical guide. Working **with** pota (this folder is
`node_modules/pota` inside an app): start with the section below.

## Using pota in an app (shipped with the package)

- `.claude/skills/pota/SKILL.md` — write idiomatic pota: signals, JSX
  conventions, built-in components, store, `use/*` plugins.
- `.claude/skills/breaking-changes/SKILL.md` — migrate an app across
  pota versions: bumping the dependency, removed / renamed / changed
  APIs.
- `documentation/content/**` — the API reference: one page per public
  export or guide topic (rendered at https://pota.quack.uy/). Find a
  symbol's page by name — `signal.md`, `components/Show.md`,
  `use/location.md`, `store/mutable.md`.
- `documentation/cheatsheet.md` — the whole public surface at a
  glance.
- `src/` — the running source and always the ground truth; follow
  `package.json` `"exports"` to the module behind any subpath.

The repo-only trees (`tests/`, `tools/`, `projects/`, the `.claude/`
rules, agents, and internal skills) are not in the npm tarball.

## Working on pota (this repository)

### Canonical guide

- **`documentation/AGENTS.md`** — the shared source of truth for all
  AI tools: project conventions, library semantics (signals, JSX,
  reactivity), the commands table, repository layout, workflow, and
  change heuristics. Start here.

### Claude Code config — `.claude/`

- `CLAUDE.md` — Claude Code entry point; imports the canonical guide
  and holds only Claude-specific extras.
- `rules/*.md` — path-scoped rules, auto-loaded when a matching path
  is touched (each declares its own `paths`): `babel-preset`,
  `components-and-use`, `core-and-lib`, `doc-links`, `exports`,
  `jsx-and-types`, `props`, `release`, `tests`.
- `skills/*/SKILL.md` — invocable skills. Internal: `docs-review`
  (resumable, source-verified docs pass) and `writing-tests` (add test
  coverage). Consumer-facing, shipped in the tarball: `pota` and
  `breaking-changes`.
- `agents/*.md` — project subagents: `pota-babel`, `pota-jsx-types`,
  `pota-release-review`.

### Maintainer notes — `documentation/`

- `todo.md` — maintainer roadmap / scratch.
- `cheatsheet.md` — quick API cheatsheet.

Consumer breaking-change migrations live in the `breaking-changes`
skill, not in a changelog file.

### API docs — `documentation/content/**`

The docs-site source (see the consumer section above for its shape).
The gitignored `projects/docs` app renders it into the site; the
`docs-review` skill keeps the tree accurate against source.

### Subsystem readmes

- `tools/readme.md` — the build / test utilities.
- `tools/test-runner/readme.md` — browser test-runner architecture and
  the `#test` contract.
- `tools/babel-preset/readme.md` — Babel-preset build tooling.
- `tests/readme.md` — test conventions, timing rules, and the coverage
  inventory.
- `typescript/readme.md` — the hand-maintained `.d.ts` surfaces.
- `tools/bench/results.md`, `tools/bench/results-short.md` — benchmark
  output (written by `npm run bench`).

### Project readme

- `readme.md` — human-facing intro (philosophy, install, links); not
  agent guidance.

## Maintaining this setup

- **Each fact has one home.** Don't duplicate a rule or invariant
  across AGENTS.md, a path-scoped rule, and a readme — duplicates
  drift apart. A one-line summary plus a pointer is fine; a second
  full copy is not.
- **Where knowledge goes:** project-wide conventions, commands, and
  workflow → `documentation/AGENTS.md`. Non-obvious subsystem
  invariants (the why, the races, the type arcana) → the matching
  `.claude/rules/` file, as terse bullets — invariants + why, with
  source as the reference for mechanism; don't create deep-dive
  narration docs under `documentation/`. Procedures an agent runs on
  demand → a skill. Mechanism humans also need → the subsystem readme.
- **Scope rules tightly** to the paths their content pertains to, so
  an edit loads only what applies (a props edit loads `props.md`
  alone, not the reactivity material).
- **Packaging:** of `.claude/`, only the two consumer-facing skills
  ship in the npm tarball; everything else there is excluded by
  `.npmignore`. A new internal skill needs a matching `.npmignore`
  entry; a new consumer-facing skill needs the usage section above
  updated.
- This map is hand-maintained: when you add, move, or remove a
  Markdown file outside `documentation/content/`, update the matching
  entry here.
