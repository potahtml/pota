# Pota Agent Notes

This repository contains `pota`, a small reactive web renderer with a
Solid-inspired reactive core, a custom JSX transform, a compiler-less
`xml` tagged-template API, built-in UI components, and a store layer
based on signalified objects and proxies.

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
- `src/lib/store.js` + `src/lib/store/`: signalified objects,
  `mutable`, reconcile (`merge` / `replace` / `reset`), and
  `project` / `firewall`
- `src/components/`: built-in components (`Show`, `For`, `Match`,
  `Switch`, `Range`, `Collapse`, `Suspense`, `Errored`, `Portal`,
  `Head`, `Normalize`, `Dynamic`, `CustomElement`, `Route`, `Tabs`)
- `src/use/`: public utilities exposed as `pota/use/*`
- `babel-preset/transform/`: custom JSX compiler internals (separate
  subpackage at the repo root; not typechecked)

## Project Reality

- Source is plain ESM JavaScript with heavy JSDoc typing, not
  TypeScript source files.
- Formatting is defined in `package.json`: tabs, no semicolons, single
  quotes, trailing commas, ~70 column prose/code style.
- Default DOM semantics are attribute-first, not property-first.
  `prop:*`, `on:*`, `use:*`, `style`, and `class` are handled by the
  props plugin layer.
- The project is intentionally pre-1.0, types are still in progress,
  and SSR is explicitly out of scope.

## Library Semantics

Non-obvious rules to follow when writing or reviewing pota code.

### Signals

- Tuple API: `const [read, write, update] = signal()`. Always use
  this order; avoid two-element destructuring like `[read, set]`,
  which confuses `write` with `update`.
- `write(value)` sets or replaces the value directly — it does
  **not** receive the previous value.
- `update(prev => next)` receives the previous value.
- When a signal is already in hand (passed as an argument, pulled
  from context), use object style: `signal.read()`, `signal.write()`,
  `signal.update()`. Destructure only when creating a signal locally.
- Prefer **derivation** (`memo`, `derived`, `resolve`) over manual
  synchronization. Effects are a last resort, not the default tool.

### JSX and DOM

- Native elements use namespaced event props: `on:click={handler}`.
  Component props use camelCase: `onClick={handler}`.
- For reactive text or children, pass the signal itself — `{count}`,
  not `{count()}`.
- Use `class=`, not `className=`.

### TypeScript and JSDoc

- Do not use `any` to paper over a missing type.
- Do not use `@ts-ignore` / `@ts-expect-error` or similar suppression
  comments. Fix the underlying type or code.
- To force a type in JSDoc, use the parenthesized cast form:
  `(/* @type {TheType} */ (value))`. Not a bare
  `/* @type {TheType} */` comment on its own line.

## Subpath Exports

The public surface is defined by `package.json` `"exports"` and
mirrors the directory layout under `src/`. Read `package.json` and
the referenced file for the current shape. Summary of what each
subpath is for:

- **`pota`** — main entry (`src/exports.js`): reactive primitives,
  renderer, prop helpers.
- **`pota/components`** — built-in UI and routing components from
  `src/components/`.
- **`pota/store`** — reactive store helpers in `src/lib/store.js`
  (`signalify`, `mutable`, `merge`, `replace`, `reset`, `project`,
  `copy`, `readonly`, `firewall`, `updateBlacklist`).
- **`pota/xml`** — compiler-less XML API in `src/core/xml.js`:
  default `xml` tagged template plus `XML()` factory for isolated
  instances with their own component registries. Templates are parsed
  as `text/xml`, so markup must be well-formed: void elements need a
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

## Tests

- Browser tests run under Puppeteer through the custom runner at
  `tools/test-runner/runner.js`. Config lives in `package.json` under
  the `"test"` key (dir, port, timeout, concurrency, extensions,
  ignore).
- `tools/test-runner/test.js` is the per-test harness: it clears
  `document.body`, `document.head`, and `document.adoptedStyleSheets`
  before each test and asserts cleanliness after, so renderer changes
  must preserve proper node disposal.
- Tests are `.jsx` / `.tsx` files transformed on the fly with the
  local Babel preset via `tools/test-runner/transform.js`.
- `npm run test:api` runs the browser suite once (all files, no
  bail). `npm run watch:test` enables watch mode. `npm run test:api
  -- --bail` stops on first failure. Positional arguments filter by
  path substring: `npm run test:api -- for`. `npm test` orchestrates
  `test:types` + `test:api` + `test:babel-preset` — use it when you
  want the full verification pass.

### Test runner architecture

The runner has four files:

| File                          | Role                                          |
| ----------------------------- | --------------------------------------------- |
| `tools/test-runner/runner.js` | CLI entry: scan, launch Puppeteer, run suite  |
| `tools/test-runner/serve.js`  | HTTP server + HTML harness with console/error capture |
| `tools/test-runner/test.js`   | Browser-side test wrapper, collects results   |
| `tools/test-runner/report.js` | Node-side formatting: `report()` and `summary()` |

**Data flow:** The HTML harness (`serve.js`) intercepts
`console.log/warn/error`, `window error`, and
`unhandledrejection` events in the browser. A `pack()` function
converts error-like objects (anything with `.stack` or `.message`)
into plain serializable `{ __error, message, stack, cause }` markers,
and DOM events (`ErrorEvent`, `PromiseRejectionEvent`) into
`{ __event, ... }` markers. Everything else passes through as-is.

`test.js` runs in the browser, wraps `pota/use/test`, and mutates
the shared `window.__pota_results__` object — test assertion
failures are packed via `packError()` preserving `{ expected, value }`
objects. Uncaught errors and unhandled rejections are captured by the
harness listeners and also written to `__pota_results__`.

On the Node side, `report.js` uses `unpack()` to convert `__error`
markers back to stack strings, and passes everything else to Node's
native `console.log/warn/error` for formatting — objects, arrays,
and primitives are printed by Node, not stringified manually.

**Console output flags:** By default, console output from passing
tests is hidden. Use `--log`, `--warn`, `--error` to show specific
types. On failure, `console.error` and `console.warn` entries
auto-show; `console.log` still requires `--log`. Assertion failures
are displayed via their `console.error` output from `pota/use/test`
(which includes colored diffs), not from `results.errors` — the
raw `{ title, expected, value }` rejections are skipped to avoid
duplication. Uncaught errors and unhandled rejections are shown
from `results.errors` (they have no matching console output).

**Formatting test:** `tests/api/console-formatting.jsx` exercises
the full capture pipeline: all console methods with various types,
error objects with cause chains, assertion failure shapes, and
`ErrorEvent`/`PromiseRejectionEvent` packing.

## Change Heuristics

- If you touch `src/core/renderer.js`, also inspect affected built-in
  components and the JSX transform output paths.
- If you touch `src/core/props/` or `src/use/dom.js`, verify DOM
  behavior and attribute/property semantics first. See
  `documentation/props-pipeline.md` for the dispatcher and value
  semantics.
- If you touch `src/core/scheduler.js`, see
  `documentation/scheduler.md` for priority ordering and the
  microtask lifecycle.
- If you touch `src/lib/reactive.js`, `src/lib/solid.js`, or
  `src/lib/store/`, verify ownership, cleanup, and proxy/reactivity
  behavior. See `documentation/reactivity.md` for the engine and
  `documentation/derived.md` for `Derived` specifics.
- If you touch routing or navigation, read both
  `src/components/route/` and `src/use/location.js`; they are
  coupled.

## Deeper Notes

- `.claude/CLAUDE.md`: project instructions and conventions specific
  to Claude Code
- `documentation/todo.md` and `documentation/breaking-changes.md`:
  maintainer notes and pending release notes
- `documentation/reactivity.md`: deep-dive on
  `createReactiveSystem()` — global state, Root / Computation /
  Memo / Derived hierarchy, the `runUpdates` flush cycle
- `documentation/derived.md`: `Derived` internals — chain
  dispatch, `lastWrite` token, per-stage re-runs
- `documentation/scheduler.md`: priority queue (`onFixes`,
  `onProps`, `onMount`, `ready`, `onDone`), microtask lifecycle,
  `readyAsync`
- `documentation/props-pipeline.md`: `assignProps` dispatch,
  plugin maps (`plugins` / `pluginsNS`), namespace handling,
  value semantics per setter
- `documentation/jsx.md` and `documentation/typescript.md`: type
  surface (JSX namespace, `Properties<T>`, component utility
  types, overload ordering)
- `documentation/errored.md`: error boundary design + how errors
  route through context
