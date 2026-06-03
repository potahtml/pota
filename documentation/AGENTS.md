# Pota Agent Notes

This repository contains `pota`, a small, pluggable reactive web
renderer for HTML and XML with a Solid-inspired reactive core, a
custom Babel preset (JSX → partials, dom-expressions-style), an
optional compiler-less `xml` tagged-template API, built-in UI
components, and a store layer based on signalified objects and
proxies. This repo is the source for the `pota` npm package.

- Site / docs: https://pota.quack.uy/
- Maintainer notes: `documentation/todo.md`,
  `documentation/breaking-changes.md`
- SSR is out of scope.

## Start Here

- `src/exports.js`: main public export map for `pota` — read this
  directly for the current API surface rather than trusting any
  hand-maintained listing
- `src/lib/reactive.js`: public reactive helpers layered on top of
  `createReactiveSystem()` from `src/lib/solid.js`
- `src/core/renderer.js`: DOM creation, rendering, JSX runtime
  helpers, partial instantiation
- `src/core/scheduler.js`: priority queue for `onFixes`, `onProps`,
  `onMount`, `ready`, `onDone`, and `readyAsync`
- `src/core/props/@main.js`: prop dispatch and plugin registration
- `src/lib/store.js` + `src/lib/store/`: store layer — signalified
  objects and reactive proxies (full API in Subpath Exports)
- `src/components/`: built-in components (`Show`, `For`, `Match`,
  `Switch`, `Suspense`, `Errored`, `Dynamic`, etc. — full set
  re-exported from `src/components/@main.js`)
- `src/use/`: public utilities exposed as `pota/use/*`
- `babel-preset/transform/`: custom JSX compiler internals (separate
  subpackage at the repo root; not typechecked)

## Library Semantics

Use this when reasoning about pota's API, JSX, examples, or typings —
not only when editing `src/`. Prefer **derivation** (`memo`,
`derived`, `resolve`) over manual synchronization; **effects are a
last resort**, not the default tool.

### Signals

- `const s = signal()`, then `s.read()`, `s.write(value)`,
  `s.update(prev => next)`.
- `write(value)` sets or replaces the value directly — it does **not**
  receive the previous value.
- `update(prev => next)` receives the previous value.

### JSX and DOM

- Native elements use namespaced event props: `on:click={handler}`.
  Component props use camelCase: `onClick={handler}`.
- For reactive text or children, pass the **reader function**:
  `{count.read}`. `{count}` passes the signal object itself, which is
  not a valid JSX child. `{count.read()}` reads once (snapshot, not
  reactive) — use it only when you want a static value. Same rule for
  component props expecting reactive values:
  `<Show when={flag.read}>`, `<Dynamic component={...}>`, etc.
- A bare JSX expression is a **static** child; a function wrapping one
  is **reactive**. `<Foo>{<div/>}</Foo>` evaluates the `<div/>` once
  and passes that single node. `<Foo>{() => <div/>}</Foo>` passes a
  function the renderer re-runs whenever its dependencies change. Same
  rule for any expression — the function wrapper is what makes a child
  reactive.
- Use `class=`, not `className=`.
- Inline `style` object keys are **kebab-case**
  (`style={{ 'flex-direction': 'column' }}`); camelCase keys are
  silently dropped (the renderer calls `style.setProperty`).

### TypeScript and JSDoc

- Do not use `any` to paper over a missing type.
- Do not use `@ts-ignore` / `@ts-expect-error` or similar suppression
  comments. Fix the underlying type or code — do not add hacks solely
  to make the checker stop complaining.
- To force a type in JSDoc, use the parenthesized cast form:
  `(/* @type {TheType} */ (value))`. Not a bare
  `/* @type {TheType} */` comment on its own line.

### Plugins under `pota/use/*`

Element-attached plugins ship as **ref factories** (`opts => node =>
…`, cleanup via the surrounding reactive scope) consumed through the
single registered `use:ref` attribute; compose several with an array:
`use:ref={[example(opts), clickOutside(handler)]}`. Do **not** register
a new `use:<name>` directive via `propsPlugin` or add `'use:<name>'?`
slots to the JSX namespace. When a plugin also needs a non-DOM form (a
callable signal), expose it separately — the ref factory takes only
what it needs for the DOM side. References: `bind`, `visible`,
`clickOutside`, `scrollIntoView`, `lazyImage`. Full do/don't list: the
components-and-use rule.

## Subpath Exports

The public surface is defined by `package.json` `"exports"` and
mirrors the directory layout under `src/`. Read `package.json` and the
referenced file for the current shape. Summary of what each subpath is
for:

- **`pota`** — main entry (`src/exports.js`): reactive primitives,
  renderer, prop helpers.
- **`pota/components`** — built-in UI and routing components from
  `src/components/`.
- **`pota/store`** — reactive store helpers (signalified objects +
  proxies) in `src/lib/store.js`; read it for the current set.
- **`pota/xml`** — compiler-less XML API in `src/core/xml.js`: default
  `xml` tagged template plus `XML()` factory for isolated instances
  with their own component registries. Templates are parsed as
  `text/xml`, so markup must be well-formed: void elements need a
  trailing slash (`<br/>`, `<img src=""/>`), every open tag must be
  closed, and attribute values must be quoted. Ill-formed input
  renders a `parsererror` element (it does not throw).
- **`pota/use/*`** — one subpath per file under `src/use/` (for
  example `pota/use/location`, `pota/use/form`, `pota/use/animate`).
- **`pota/jsx-runtime`** / **`pota/jsx-dev-runtime`** — JSX runtime
  for bundlers (`src/jsx/jsx-runtime.js`).
- **`pota/babel-preset`** — custom Babel preset that lowers JSX into
  partials for the renderer; separate Rollup build under
  `babel-preset/` at the repo root. The CJS artifact is emitted to
  `generated/babel-preset.cjs`.

## Commands

Run from the repository root after `npm install`. Every `build:*` has
a matching `watch:*` that rebuilds on changes; only the build form is
listed below.

| Command                           | Purpose                                                                                                                                                                                                                            |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                     | Wipes `generated/*`, runs a one-shot `build:ts` (failure tolerated), then spawns all `watch:*` via `tools/watch.js`                                                                                                                                                        |
| `npm run clean`                   | Wipe `generated/*`                                                                                                                                                                                                                 |
| `npm run build:ts`                | `tsc` once — typecheck `src/` and emit declarations into `generated/types/`                                                                                                                                                        |
| `npm run build:babel-preset`      | Rollup once — outputs `generated/babel-preset.cjs` + `generated/babel-preset-standalone.js`                                                                                                                                        |
| `npm run build:generate`          | `tools/generate.js` once — regenerate importmap / types JSON                                                                                                                                                                       |
| `npm run format`                  | Format code with Biome (`biome.json`); markdown + JSDoc with Prettier (`format:md` / `format:jsdoc`)                                                                                                                                                                                          |
| `npm test`                        | Run everything — `test:types` + `test:api` + `test:babel-preset`                                                                                                                                                                   |
| `npm run test:api`                | Browser tests once via Puppeteer; config in `package.json` `"test"` key. Flags: `--bail`, `--log`, `--warn`, `--error`, `--coverage`. Positional arg filters by path substring (`-- for`). `watch:test` runs in watch mode.        |
| `npm run coverage`                | Same as `test:api` but with V8 coverage → c8 HTML + text report in `generated/coverage/`                                                                                                                                           |
| `npm run test:babel-preset`       | Puppeteer tests for the standalone Babel preset bundle                                                                                                                                                                             |
| `npm run test:types`              | Typecheck `src/` + `tests/` + `babel-preset/` in one sequential run                                                                                                                                                                |
| `npm run bench`                   | Run `tools/bench/runner.mjs` against the `pota.docs` dev benchmark page — heap snapshot, per-action timings, V8 deopts. Writes `tools/bench/results.md` + prepends to `results-short.md`. Pass `-- --no-write` to skip the writes. |
| `npm run bench:profile`           | CPU sampling profile via `tools/bench/prof.mjs` — top hot frames by self + inclusive time.                                                                                                                                         |
| `npm run bench:profile-trace`     | Chrome `devtools.timeline` trace — decomposes the cycle into JS / Layout / Paint / Style / GC. Use when sampling shows `(program)` dominating.                                                                                     |
| `npm run bench:profile-heap`      | V8 `HeapProfiler` allocation sampling — top allocation sites for finding GC-pressure sources.                                                                                                                                      |
| `npm run bench:profile-no-inline` | `bench:profile` with V8 inlining disabled. Use to confirm sample attributions aren't inflated by inlining.                                                                                                                         |

## Repository Layout

| Path              | Role                                                                                                                                                                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/exports.js`  | Main package entry                                                                                                                                                                                                                                          |
| `src/core/`       | Renderer, scheduler, XML, props pipeline                                                                                                                                                                                                                    |
| `src/jsx/`        | JSX runtime (`jsx-runtime.js`)                                                                                                                                                                                                                              |
| `src/lib/`        | Reactive primitives, store, Solid-compat helpers                                                                                                                                                                                                            |
| `src/use/`        | Composables / hooks-style modules (`pota/use/*`)                                                                                                                                                                                                            |
| `src/components/` | Built-in components (`pota/components`)                                                                                                                                                                                                                     |
| `babel-preset/`   | Babel preset (subpackage at repo root, separate Rollup build — see Subpath Exports for details)                                                                                                                                                             |
| `documentation/`  | Maintainer notes (`todo.md`, `breaking-changes.md`) plus the `ai/` AI-guidance subtree. |
| `documentation/ai/` | Vendor-neutral AI guidance — `AGENTS.md` (this file); other AI tools read it directly |
| `.claude/` | Claude Code config — `CLAUDE.md`, path-scoped `rules/`, `agents/`, `skills/`, `settings*.json` |
| `projects/` | Gitignored sibling apps (docs site, benchmarks, demos) — not part of the npm package |
| `generated/`      | **All generated output — gitignored, never commit.** Rebuilt by `tsc` / Rollup / `tools/generate.js`; ships in the npm tarball except `docs/**` and the standalone bundle. |
| `tests/`          | Browser tests; `tests/api/components/` mirrors `src/components/`                                                                                                                                                                                            |
| `tools/`          | Build / test utilities — `generate.js`, `release.js`, `watch.js`, `babel-preset/`, `test-runner/` (see its `readme.md`), `bench/`, `ai-docs-review/` (docs-review scripts)                              |
| `typescript/`     | Hand-maintained `.d.ts` (`exports.d.ts`, `jsx/`, …); most subpath types are tsc-emitted under `generated/types/` instead                                                                                                                                                                         |

## Conventions

- **Language:** plain ESM JavaScript in `src/` with strict TypeScript
  checking via `checkJs` (`tsconfig.json` uses `allowJs` + `checkJs` +
  `emitDeclarationOnly`, `include`s `src/` only — `babel-preset/` is
  outside and not typechecked). Match existing style; do not convert
  the whole tree to `.ts` unless explicitly requested.
- **Formatting:** code (JS/JSX/TS) is formatted by **Biome**
  (`biome.json`); markdown and JSDoc by **Prettier** (`package.json`).
  Tabs, single quotes, no semicolons, trailing commas, width 70;
  `generated/` is excluded. Run `npm run format` after substantive
  edits — don't hand-format to a different style.
- **DOM:** default semantics are attribute-first, not property-first.
  `prop:*`, `on:*`, `use:*`, `style`, and `class` are handled by the
  props plugin layer (`src/core/props/`).
- **Exports:** public surface is defined by `package.json` `"exports"`
  and `src/exports.js`; keep subpath contracts stable unless a release
  / breaking change is intentional.
- **Scope:** prefer minimal, task-focused changes. Avoid drive-by
  refactors and unrelated files. Types are a known work in progress —
  extend them carefully and run `npm run watch:ts` when touching typed
  surfaces.
- **Conciseness in docs:** prefer the concept over enumerations that
  drift. Skip counts ("37 tests"), default values mirrored from configs
  (point at `package.json` / `tsconfig.json` / source), exhaustive
  file/export listings when the concept is the point, historical
  framing ("used to be X") once shipped, preambles that restate the
  heading, and line-by-line narration of adjacent code. Keep the why,
  the invariants, and the gotchas — anything not obvious from the
  source.

## Workflow

- **Investigating failing tests:** work **one failing test at a
  time**. Read the code, form a hypothesis, report the root cause and
  candidate fixes — then wait for direction before editing source or
  tests. Don't batch investigations or jump ahead.
- **Failing test you just wrote:** never silently delete, disable, or
  rewrite it to make it pass. Surface the failure with the assertion
  that failed, the observed behavior, a short hypothesis of why, and
  options (document the current behavior, fix the library, drop the
  test). Let the maintainer pick. The failure itself is information —
  it may have revealed a real library limitation.
- **Permissions:** `src/` changes need explicit maintainer approval;
  docs (`documentation/**`) and the docs-site project are edit-direct
  (the maintainer reviews diffs). Don't auto-start the docs dev server
  or other external services — ask first.
- **Git:** never `commit` / `push`, or offer to — the maintainer
  commits (if explicitly told to, omit any AI-tool attribution /
  co-author trailer). Read-only git only (`diff` / `log` / `show` /
  `status`); never `stash` / `checkout` / `restore` / `reset` /
  `clean`, including in any subagent you spawn.
- **Showing code changes:** the maintainer wants Claude Code's
  Edit/Write rendering (line numbers + colored +/- backgrounds). That
  rendering only appears for Edit/Write tool calls.
  - Comparing two existing files or showing committed history → use
    `diff --color=always`
  - To preview a change you're not yet cleared to apply, diff a
    scratch copy (`git diff --no-index`) — don't edit the real file.
  - Never paste a full file or a before/after side-by-side.

## Tooling

- **`sed`:** allowed for **read-only** operations (e.g.
  `sed -n '10,20p' file` to peek at a line range). Do **not** use
  `sed -i` or any in-place modification — use the editor tool for
  changes so diffs stay reviewable.

## Tests

Two facts that affect how you write or read tests; full runner
architecture is in `tools/test-runner/readme.md`:

- The per-test harness clears `document.body`, `document.head`, and
  `document.adoptedStyleSheets` before each test and asserts the same
  cleanliness after — so renderer changes must preserve proper node
  disposal or the next test will fail this check.
- Tests are `.jsx` / `.tsx` files transformed on the fly with the
  local Babel preset; you don't need to build anything before running
  them.

## Change Heuristics

Coupled files to check together; per-subsystem invariants live in the
matching `.claude/rules/` file and in the source.

- `src/core/renderer.js` — also inspect affected built-in components
  and the JSX transform output paths.
- `src/core/props/` / `src/use/dom.js` — verify DOM and
  attribute/property semantics first.
- `src/core/scheduler.js` — priority ordering and microtask lifecycle.
- `src/lib/reactive.js` / `src/lib/solid.js` / `src/lib/store/` —
  verify ownership, cleanup, and proxy/reactivity behavior; the
  `map()` / `<For>` reconciliation loop is subtle, read it before
  changing.
- Routing/navigation — `src/components/route/` and
  `src/use/location.js` are coupled.

## Area notes

There are no separate deep-dive docs: each subsystem's non-obvious
invariants live as **path-scoped rules** under `.claude/rules/`, which
Claude Code auto-loads when the matching paths are touched. Other tools
should read the source (the reference for mechanism). `todo.md` and
`breaking-changes.md` are maintainer notes; `.claude/CLAUDE.md` is
Claude Code-specific extras.
