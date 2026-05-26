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

- Object API (preferred): `const s = signal()`, then `s.read()`,
  `s.write(value)`, `s.update(prev => next)`. Use this in all new
  code.
- `write(value)` sets or replaces the value directly — it does **not**
  receive the previous value.
- `update(prev => next)` receives the previous value.
- Tuple form `const [read, write, update] = signal()` still works and
  the renderer still treats the return value as an array (see _JSX and
  DOM_ below for the `{count}` foot-gun) — but it is being phased out.
  Migrate to the object form when you touch the surrounding code; do
  not add new tuple destructures.

### JSX and DOM

- Native elements use namespaced event props: `on:click={handler}`.
  Component props use camelCase: `onClick={handler}`.
- For reactive text or children, pass the **reader**: `{count.read}`.
  Never `{count}` — `signal()` returns `[read, write, update]` (a real
  Array with attached methods), so `{count}` makes the renderer
  iterate it and call each function as a child (`write()` with no args
  clobbers the signal to `undefined`, then garbage like `"true"`
  renders). `{count()}` is a one-time snapshot, not a reactive binding
  — use it only when you genuinely want a static value. Same rule for
  component props that expect reactive values:
  `<Show when={flag.read}>`, `<Dynamic component={...}>`, etc.
- A bare JSX expression is a **static** child; a function wrapping one
  is **reactive**. `<Foo>{<div/>}</Foo>` evaluates the `<div/>` once
  and passes that single node. `<Foo>{() => <div/>}</Foo>` passes a
  function the renderer re-runs whenever its dependencies change. Same
  rule for any expression — the function wrapper is what makes a child
  reactive.
- Use `class=`, not `className=`.

### TypeScript and JSDoc

- Do not use `any` to paper over a missing type.
- Do not use `@ts-ignore` / `@ts-expect-error` or similar suppression
  comments. Fix the underlying type or code — do not add hacks solely
  to make the checker stop complaining.
- To force a type in JSDoc, use the parenthesized cast form:
  `(/* @type {TheType} */ (value))`. Not a bare
  `/* @type {TheType} */` comment on its own line.

### Plugins under `pota/use/*`

Element-attached plugins ship as **ref factories** consumed via the
single registered `use:ref` lifecycle attribute. Do not register a new
custom `use:<name>` directive via `propsPlugin`; do not add new
`'use:<name>'?` slots to the JSX namespace.

```js
// in src/use/example.js
export const example = options => node => {
	// wire side effects to `node`; cleanup runs via the
	// surrounding reactive scope.
}
```

```jsx
// at the call site
<input use:ref={example(opts)} />
<input use:ref={[example(opts), clickOutside(handler)]} /> // compose
```

When a plugin also needs a non-DOM form (a callable signal that
consumers can read elsewhere), expose it as a separate value — the ref
factory takes only what it needs for the DOM side. See `bind`,
`visible`, `clickOutside`, `scrollIntoView`, `lazyImage` as
references.

## Subpath Exports

The public surface is defined by `package.json` `"exports"` and
mirrors the directory layout under `src/`. Read `package.json` and the
referenced file for the current shape. Summary of what each subpath is
for:

- **`pota`** — main entry (`src/exports.js`): reactive primitives,
  renderer, prop helpers.
- **`pota/components`** — built-in UI and routing components from
  `src/components/`.
- **`pota/store`** — reactive store helpers in `src/lib/store.js`
  (`signalify`, `mutable`, `merge`, `replace`, `reset`, `project`,
  `copy`, `readonly`, `updateBlacklist`).
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
| `npm run dev`                     | Wipes `generated/*`, then spawns all `watch:*` scripts via `tools/watch.js`                                                                                                                                                        |
| `npm run clean`                   | Wipe `generated/*`                                                                                                                                                                                                                 |
| `npm run build:ts`                | `tsc` once — typecheck `src/` and emit declarations into `generated/types/`                                                                                                                                                        |
| `npm run build:babel-preset`      | Rollup once — outputs `generated/babel-preset.cjs` + `generated/babel-preset-standalone.js`                                                                                                                                        |
| `npm run build:generate`          | `tools/generate.js` once — regenerate importmap / types JSON                                                                                                                                                                       |
| `npm run format`                  | Prettier write (config in `package.json`)                                                                                                                                                                                          |
| `npm test`                        | Run everything — `test:types` + `test:api` + `test:babel-preset`                                                                                                                                                                   |
| `npm run test:api`                | Browser tests once via Puppeteer; config in `package.json` `"test"` key. Flags: `--bail`, `--log`, `--warn`, `--error`, `--coverage`. Positional arg filters by path substring (`-- for`). `watch:test` runs in watch mode.        |
| `npm run test:coverage`           | Same as `test:api` but with V8 coverage → c8 HTML + text report in `generated/coverage/`                                                                                                                                           |
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
| `documentation/`  | Maintainer notes (`todo.md`, `breaking-changes.md`) plus canonical reference docs (this file, `reactivity.md`, `derived.md`, `scheduler.md`, `props-pipeline.md`, `jsx.md`, `typescript.md`, `errored.md`)                                                  |
| `generated/`      | **All generated outputs — gitignored.** Rebuilt by `tsc`, the preset Rollup build, the standalone Rollup build, and `tools/generate.js`. Everything except `docs/**` and `babel-preset-standalone.js` ships in the npm tarball. Never commit anything here. |
| `tests/`          | Browser tests; `tests/api/components/` mirrors `src/components/`                                                                                                                                                                                            |
| `tools/`          | Build / test utilities. `generate.js` (importmap/types JSON), `release.js` (version / publish), `babel-preset/` (Rollup configs + Puppeteer tests), `test-runner/` (Puppeteer test runner — see `tools/test-runner/readme.md`)                              |
| `typescript/`     | All hand-maintained `.d.ts` files (`exports.d.ts`, `jsx.d.ts`, `action.d.ts`, etc.)                                                                                                                                                                         |

## Conventions

- **Language:** plain ESM JavaScript in `src/` with strict TypeScript
  checking via `checkJs` (`tsconfig.json` uses `allowJs` + `checkJs` +
  `emitDeclarationOnly`, `include`s `src/` only — `babel-preset/` is
  outside and not typechecked). Match existing style; do not convert
  the whole tree to `.ts` unless explicitly requested.
- **Formatting:** Prettier settings in `package.json` (tabs, no semis,
  single quotes, trailing commas, `printWidth` 70). Prefer
  `npm run format` after substantive edits.
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
  drift. Skip:
  - **Counts** ("37 tests for X", "12 checks") — the table or test
    file is the source of truth.
  - **Default values** mirrored from configs — defaults live in
    `package.json` / `tsconfig.json` / source; point there.
  - **Exhaustive file or export listings** when the concept is the
    point ("public utilities under `pota/use/*`" beats naming every
    module).
  - **Historical framing** ("used to be X, now Y") once a change has
    shipped — describe the current state.
  - **Preambles** that restate the section header or the next
    paragraph.
  - **Line-by-line narration** that paraphrases an adjacent code
    block. Keep the why, the invariants, the gotchas — anything not
    obvious from reading the source.

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
- **Showing code changes:** the maintainer wants Claude Code's
  Edit/Write rendering (line numbers + colored +/- backgrounds). That
  rendering only appears for Edit/Write tool calls.
  - Comparing two existing files or showing committed history → use
    `diff --color=always`
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

- If you touch `src/core/renderer.js`, also inspect affected built-in
  components and the JSX transform output paths.
- If you touch `src/core/props/` or `src/use/dom.js`, verify DOM
  behavior and attribute/property semantics first. See
  `documentation/props-pipeline.md` for the dispatcher and value
  semantics.
- If you touch `src/core/scheduler.js`, see
  `documentation/scheduler.md` for priority ordering and the microtask
  lifecycle.
- If you touch `src/lib/reactive.js`, `src/lib/solid.js`, or
  `src/lib/store/`, verify ownership, cleanup, and proxy/reactivity
  behavior. See `documentation/reactivity.md` for the engine and
  `documentation/derived.md` for `Derived` specifics.
- If you touch the `map()` / `<For>` reconciliation loop in
  `src/lib/reactive.js`, remember that `toDiff` (in `src/use/dom.js`)
  **only removes** nodes that aren't in the next set — it does not add
  and does not reorder. The smart loop inside `map()` is the sole
  mechanism for both placement (adds) and reordering of keyed lists.
  When reasoning about whether a disjunct in the smart loop is
  load-bearing, assume it is — `toDiff` won't cover misses. The
  fallback loop at the end of the smart loop is the safety net for
  when the two smart branches can't find an anchor.
- If you touch routing or navigation, read both
  `src/components/route/` and `src/use/location.js`; they are coupled.

## Deeper docs

Per-area deep dives live in `documentation/`: `reactivity.md`,
`derived.md`, `scheduler.md`, `props-pipeline.md`, `jsx.md`,
`typescript.md`, `errored.md`. `todo.md` and `breaking-changes.md` are
maintainer notes. `.claude/CLAUDE.md` is Claude Code-specific extras
(path-scoped rules under `.claude/rules/`, project subagents under
`.claude/agents/`); other AI tools can ignore that file.
