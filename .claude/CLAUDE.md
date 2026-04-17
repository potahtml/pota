# pota — guidance for Claude

pota is a small, pluggable reactive web renderer for HTML and XML,
with a Babel preset (JSX → partials, dom-expressions-style) and an
optional compiler-less XML API. API shape is influenced by SolidJS;
this repo is the source for the `pota` npm package.

- Site / docs: https://pota.quack.uy/
- Maintainer notes: `documentation/todo.md`
- Agent-facing conventions and library semantics:
  `documentation/AGENTS.md` (also imported below)
- SSR is out of scope for this project.

## Library semantics (summary)

Use this when reasoning about pota’s API, JSX, examples, or
typings—not only when editing `src/`. Prefer **derivation** (`memo`,
`derived`) over manual sync; **effects are a last resort**, not the
default tool.

### Signals

- Tuple API: `const [read, write, update] = signal()`. Prefer this
  **order**; avoid two-element destructuring that confuses `write` vs
  `update`.
- `write` sets/replaces a value directly (**does not** receive the
  previous value). `update` receives the previous value:
  `update(prev => …)`.
- **Object style** when a signal is passed in or from context:
  `signal.read()`, `signal.write()`, `signal.update()`.
  **Destructure** when creating a signal locally.

### JSX and DOM (pota conventions)

- Native elements: `on:click={handler}`; component props:
  `onClick={handler}`.
- For reactive text/children, pass the **signal** (e.g. `{count}`),
  not `{count()}`.
- Prefer `class=` for CSS classes in JSX (not `className=`).

### TypeScript and types (in `src/`)

- Do not use `any` to silence missing types. Do not use `@ts-ignore` /
  `@ts-expect-error` (or similar) to hide errors.
- In JSDoc, to force a type on a value use
  `(/* @type {TheType} */ (value))` — not a bare `/* @type … */`
  comment on its own line.
- Fix the underlying types or code; do not add hacks solely to make
  the checker stop complaining.

## Commands

Run from the repository root after `npm install`:

| Command                      | Purpose                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------ |
| `npm run dev`                | Wipes `generated/*`, then spawns all `watch:*` scripts via `tools/watch.js`   |
| `npm run clean`              | Wipe `generated/*`                                                             |
| `npm run build:ts`           | Run `tsc` once — typecheck and emit declarations into `generated/types/`      |
| `npm run build:babel-preset` | Run Rollup once — outputs `generated/babel-preset.cjs` + `generated/babel-preset-standalone.js` |
| `npm run build:generate`     | Run `tools/generate.js` once — regenerate importmap / types JSON              |
| `npm run watch:ts`           | Same as `build:ts` but stays alive and rebuilds on changes                    |
| `npm run watch:ts-tests`     | Typecheck every `.jsx` / `.tsx` / `.d.ts` under `tests/` in watch mode (no emit) |
| `npm run watch:ts-babel-preset` | Typecheck the `babel-preset/` subpackage in watch mode (no emit)           |
| `npm run watch:babel-preset` | Same as `build:babel-preset` but stays alive and rebuilds on changes          |
| `npm run watch:generate`     | Same as `build:generate` but stays alive and regenerates on changes           |
| `npm run format`             | Prettier write (config in `package.json`)                                      |
| `npm test`                   | Run everything — `test:types` + `test:api` + `test:babel-preset`              |
| `npm run test:api`           | Run browser tests once with Puppeteer; config in `package.json` `"test"` key  |
| `npm run test:api -- for`    | Run only test files whose path contains "for" (positional filter)              |
| `npm run watch:test`         | Run browser tests in watch mode (re-runs on file changes)                      |
| `npm run test:api -- --bail` | Run browser tests, stopping on first failure                                   |
| `npm run test:api -- --log`  | Show `console.log` output (always opt-in)                                      |
| `npm run test:api -- --warn` | Show `console.warn` output (auto-shown on failure)                             |
| `npm run test:api -- --error`| Show `console.error` output (auto-shown on failure)                            |
| `npm run test:babel-preset`  | Run Puppeteer tests for the standalone Babel preset bundle (12 checks)         |
| `npm run test:types`         | Typecheck `src/` + `tests/` + `babel-preset/` in one sequential run           |
| `npm run test:ts`            | Same command as `build:ts` (`tsc` with the root tsconfig — typechecks `src/` and emits declarations); grouped under `test:types` |
| `npm run test:ts-tests`      | Typecheck every `.jsx` / `.tsx` / `.d.ts` under `tests/` (no emit)             |
| `npm run test:ts-babel-preset` | Typecheck the `babel-preset/` subpackage (no emit)                           |

## Repository layout

| Path                      | Role                                                                |
| ------------------------- | ------------------------------------------------------------------- |
| `src/exports.js`          | Main package entry                                                  |
| `src/core/`               | Renderer, scheduler, XML, props pipeline                            |
| `src/jsx/`                | JSX runtime (`jsx-runtime.js`)                                      |
| `src/lib/`                | Reactive primitives, store, Solid-compat helpers                    |
| `src/use/`                | Composables / hooks-style modules (`pota/use/*`)                    |
| `src/components/`         | Built-in components (`pota/components`)                             |
| `babel-preset/`           | Babel preset and transforms (separate Rollup build; subpackage at repo root) |
| `documentation/`          | Maintainer docs (`todo.md`, `breaking-changes.md`)                  |
| `generated/`              | **All generated outputs** (gitignored). Everything under `generated/` except `docs/**` and `babel-preset-standalone.js` ships in the npm tarball |
| `generated/types/`        | tsc declaration output — referenced from `package.json` `"exports"` |
| `generated/babel-preset.cjs` | Babel preset CJS build output                                    |
| `generated/babel-preset-standalone.js` | Standalone browser bundle (does not ship)                      |
| `generated/docs/`         | `importmap.json` / `types.json` consumed by the docs site (does not ship) |
| `tests/`                  | Browser tests; `tests/api/components/` mirrors `src/components/`    |
| `tools/`                  | Shared build/test utilities (`utils.js`)                            |
| `tools/generate.js`          | Docs importmap / types JSON generator                               |
| `tools/release.js`        | Version bump, tag, publish script                                   |
| `tools/babel-preset/`        | Rollup configs (preset CJS + standalone IIFE), entry, and Puppeteer tests |
| `tools/test-runner/`      | Custom Puppeteer test runner, server, Babel transform, and reporting |
| `typescript/`             | All hand-maintained `.d.ts` files (`exports.d.ts`, `jsx.d.ts`, `action.d.ts`, etc.) |

`tsconfig.json` uses `allowJs` + `checkJs` + `emitDeclarationOnly`; it
includes `src/` only (the `babel-preset/` subpackage lives outside
`include` and so is not typechecked).

## Conventions

- **Language:** JavaScript in `src/` with strict TypeScript checking
  via `checkJs`. Match existing style; do not convert the whole tree
  to `.ts` unless explicitly requested.
- **Formatting:** Prettier settings live in `package.json` (tabs, no
  semis, single quotes, `printWidth` 70, etc.). Prefer
  `npm run format` after substantive edits.
- **Exports:** Public surface is defined by `package.json` `"exports"`
  and `src/exports.js`; keep subpath contracts stable unless a release
  / breaking change is intentional.
- **Scope:** Prefer minimal, task-focused changes. Avoid drive-by
  refactors and unrelated files. Types are a known work in progress —
  extend them carefully and run `npm run watch:ts` when touching typed
  surfaces.

## Generated / sensitive paths

- The entire `generated/` tree is gitignored. Never commit anything
  under it — it is rebuilt by `tsc`, the preset Rollup build, the
  standalone Rollup build, and `tools/generate.js`.

## Claude Code (this repo)

Project instructions live in **this file** (`.claude/CLAUDE.md`).
Additionally:

- **Path-scoped rules:** `.claude/rules/` — extra instructions when
  working in matching paths (JSX/types, Babel preset, core/lib,
  components/use, release, exports).
- **Project subagents:** `.claude/agents/` — `pota-babel`,
  `pota-jsx-types`, `pota-release-review` (invoke by name or let
  Claude delegate when the task fits).
- **`sed` usage:** allowed for **read-only** operations (e.g.
  `sed -n '10,20p' file` to peek at a line range). Do **not** use
  `sed -i` or any in-place modification — use the `Edit` tool for
  changes so diffs stay reviewable.

## Canonical reference (full detail)

Expanded agent notes — library semantics, subpath exports, test
harness, and change heuristics:

@../documentation/AGENTS.md
