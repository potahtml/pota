---
paths:
  - 'src/lib/**'
  - 'src/core/scheduler.js'
  - 'src/core/renderer.js'
---

# Reactive core, scheduler, renderer

Covers the reactive engine and store (`src/lib/**`), the scheduler
(`src/core/scheduler.js`), and the renderer (`src/core/renderer.js`).
The props pipeline has its own rule.

`src/lib/solid.js` is the engine — a `createReactiveSystem()` factory;
`src/lib/reactive.js` calls it once and re-exports, adding `map`,
`resolve`, `signalFunction`, etc. It descends from Solid 1.x, ported to
classes and extended (`derived`, `owned`, `asyncTracking`,
`catchError`); mirror Solid only where pota intentionally aligns, and
comment divergences. Hot paths matter — preserve allocation and
scheduling patterns unless the task calls for a redesign. Run
`npm run build:ts` after typed / JSDoc edits.

The sections below are the non-obvious invariants — things that read as
if they could be otherwise but are load-bearing. Source is the
reference for mechanism; this is the why. Signal/JSX basics are in
AGENTS.md (Library Semantics).

## Reactive engine (`src/lib/solid.js`)

- **Node tree:** `Root` → `Computation` → { `Effect` (`user=true`),
  `SyncEffect` (`user=false`), `Memo` → `Derived` }. `Owner` controls
  lifetime (disposal, cleanups, context); `Listener` controls tracking
  (which signals are observed). Usually the same node, but `untrack`
  clears `Listener` while keeping `Owner` — reads don't subscribe, but
  cleanups/children still attach. `signal()` is a closure factory (the
  value is a closed-over local, observer state lives on a plain object
  `o`); equality is `===`, `{ equals: false }` always notifies.
- **Tri-state:** `CLEAN(0)` / `STALE(1)` / `CHECK(2)`. On a write,
  `doWrite` sets **all** observers `STALE` but queues only the `CLEAN`
  ones (others are already queued); `downstream` marks transitive
  observers `CHECK` ("maybe dirty"). `upstream` resolves `CHECK`
  lazily — the pull half; the push half (`doWrite`) re-marks a node
  `STALE` only if a source's value actually changed. A `Memo` whose
  recomputed value is unchanged leaves observers `CHECK`/`CLEAN` — they
  never re-run. That is the memo optimization boundary.
- **Flush order (`runUpdates`/`batch`):** the outermost call owns the
  flush. **Phase 1 flushes memos, Phase 2 flushes effects** — always
  memos before effects, so effects read a consistent graph. Within
  effects, **internal `SyncEffect`s run before user `Effect`s** so
  framework setup (context, `catchError`) completes before user code
  observes it. `runTop` updates **ancestors before children**
  (top-down) to avoid a child re-running against a stale parent.
- **Disposal-on-rerun:** a computation `dispose()`s itself *before*
  every re-run — unlinks from sources (swap-remove via stored slot
  indices), disposes owned children, runs cleanups — then re-runs
  `fn`. So tracking is rebuilt fresh each run; a branch that stops
  reading a signal auto-unsubscribes. No manual dep management. Order
  is children-then-cleanups, both reverse/LIFO.
- **`owned(cb, onCancel)`** makes a callback disposal-aware (a
  promise's `.then` can fire after its computation disposed). It runs
  `cb` under the original owner only if not yet disposed, else
  `onCancel`. Used by the scheduler's `add`, events (`ownedEvent`), and
  promise resolution.
- **Context** is a symbol-keyed record copied-on-write up the `Owner`
  chain (`Owner.context = { ...Owner.context, [id]: v }`); lookups are
  O(1). Providers use `syncEffect` so context is set before children
  run.
- **Allocation:** `owned`/`cleanups` share a single `EMPTY` sentinel
  array while empty (no per-node allocation; stable JSArray slot type
  for V8), promoted to a real array on the first add — a single entry
  is `[fn]`, not an inlined value. `withValue`'s terminal `fn(value)`
  path is allocation-free (lazy `wroteValue`/`resolved`) — most prop
  writes hit it, so keep it lean.

## `Derived` (`src/lib/reactive.js` → `derived`)

Writable memo that lazily unwraps functions / promises / arrays via
`withValue`; the chain `derived(f0, f1, f2)` is just `this.fn`.

- `d()` reads (and tracks). `d(value)` writes a **temporary** override:
  chain effects stay alive, and the next change to any stage's
  dependency re-runs from that stage onward and overwrites the
  override — **dependency changes are authoritative**.
- **Per-stage re-run:** a dep change re-runs only from the affected
  stage to the end; earlier stages keep their cached results.
- **`lastWrite`** is a monotonic integer counter (not object
  identity), bumped once per chain run. A commit proceeds only if
  `Listener || lastWrite === mine`. This closes two races: (1) a late
  promise clobbering a newer sync write; (2) two pending promises where
  the older resolves last. Inside an effect re-run (`Listener` set)
  commits always proceed; async callbacks must match the token.
- Chain dispatch uses **`fns.slice(1)`** (fresh array per stage), not
  `shift()` — `shift()` mutated the shared array and lost the tail on
  re-runs.
- Tests: `tests/api/reactivity/derived.jsx`,
  `derived-chain-current.jsx`, and `derived-chain-expected.jsx` (the
  expected end-state of the chain). Run one alone with
  `npm run test:api -- derived-chain-expected`.

## `map()` / `<For>` reconciliation (`src/lib/reactive.js`)

`map()`'s smart loop is the **sole** mechanism for both placement
(adds) and reordering of keyed lists. `toDiff` (in `src/use/dom.js`)
**only removes** nodes absent from the next set — it does not add and
does not reorder. So when judging whether a disjunct in the smart loop
is load-bearing, assume it is: `toDiff` won't cover a miss. The
fallback loop at the end of the smart loop is the safety net for when
the two smart branches can't find an anchor.

## Scheduler (`src/core/scheduler.js`)

One microtask-driven priority queue, six fixed buckets. Only `ready` /
`readyAsync` are public; the rest let the renderer and props pipeline
cooperate without leaking timing into user code.

| Pri | Name      | Purpose                              |
| --- | --------- | ------------------------------------ |
| 0   | `onFixes` | before everything (e.g. focus)       |
| 1   | `onProps` | prop plugins with `onMicrotask=true` |
| 2   | `onMount` | after props applied                  |
| 3   | `ready`   | public `ready(fn)`                   |
| 4   | `onDone`  | after user processes                 |
| 5   | _(unused)_| reserved                             |

- `add` wraps `fn` in `owned(fn)` (a disposed owner cancels it). `run`
  captures the live buckets and installs fresh ones (via `reset`)
  **before** iterating, so callbacks scheduled during a flush land in
  the next microtask's buckets instead of mutating the array being
  iterated.
- `ready` fires after every synchronous render; `readyAsync` waits for
  all in-flight `withValue` promises to settle (counter→0, dispatched
  via a double `queueMicrotask`). Test-timing rules are in
  `tests/readme.md`.

## Error routing (`src/lib/solid.js`)

Context-based, not an owner-chain walk. A private `errorHandlerId`
symbol is stored on `Owner.context`; `routeError(node, err)` is one
O(1) lookup → handler, else `console.error`.

- **Two catch levels, different phases.** `update()` (Computation /
  Memo / Derived) catches errors during **reactive re-runs**: marks
  `STALE`, `disposeOwned()`, sets `updatedAt = time + 1` (blocks an
  immediate re-run), then routes. `runWithOwner` catches **deferred
  execution** (`owned`/`.then`, event handlers, `root()` setup): just
  routes, no node cleanup.
- **`runWith` deliberately does NOT catch.** If it did,
  `untrack(() => { throw })` inside an effect would be caught at the
  wrong level, leaving the effect running in a broken state instead of
  being aborted by the `update()` catch.
- **`catchError(fn, handler)`** runs in a `syncEffect` sub-owner so
  catching is scoped to descendants; `fn` runs `untrack`ed (it's an
  error boundary, not a reactive one). `safeHandler` escalates a
  throwing handler to the parent handler — no loops.
- **`Root.doCleanups()`** wraps each cleanup in try/catch and routes —
  a throwing cleanup neither blocks the remaining cleanups nor crashes
  `update()`. The `Errored` component contract lives in the
  components-and-use rule.
