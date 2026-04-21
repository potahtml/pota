# Scheduler — design and implementation

`src/core/scheduler.js` owns a tiny priority queue that runs once per
microtask and dispatches callbacks at six fixed priority levels. It is
the layer that guarantees ordering between prop-plugin callbacks,
lifecycle hooks, and the user-facing `ready`/`onDone` APIs.

Related files:

- `src/core/scheduler.js` — the queue itself
- `src/core/props/plugin.js` — wraps plugin handlers in `onProps(...)`
  when registered with `onMicrotask=true` (the default)
- `src/core/props/lifecycle.js` — `setRef` / `setConnected` /
  `setDisconnected` schedule via `onMount`

---

## Priority levels

```js
queue = [ [], [], [], [], [], [] ]
         0    1    2    3    4    5
```

| Priority | Public name | Purpose                                              |
| -------- | ----------- | ---------------------------------------------------- |
| 0        | `onFixes`   | Runs before everything else (e.g. focus restoration) |
| 1        | `onProps`   | Prop plugins registered with `onMicrotask=true`      |
| 2        | `onMount`   | After props have been applied                        |
| 3        | `ready`     | Public `ready(fn)` — after mount                     |
| 4        | `onDone`    | Runs after user-defined processes                    |
| 5        | _(unused)_  | Reserved slot                                        |

Only `ready` (and the async-tracking counterpart `readyAsync`) are
exported from `pota`. The other four are internal — they exist to let
the renderer and the props pipeline cooperate without leaking timing
details into user code.

---

## Queue lifecycle

`add(priority, fn)`:

1. If nothing is queued yet, schedules `run` as a microtask and sets
   the `added` flag so subsequent `add()` calls don't re-queue.
2. Wraps `fn` in `owned(fn)` so it inherits the current owner's
   cleanup scope — a disposed owner cancels the callback without
   running it.
3. Pushes the wrapped function into the priority bucket.

`run()`:

1. Swaps the live buckets for fresh empty ones (`reset()`), clearing
   the `added` flag so new calls during flush schedule a new microtask
   instead of piggy-backing on the current one.
2. Iterates buckets in priority order, calling each bucket in
   sequence.

The double-swap pattern means every `run()` starts with the buckets it
owned when the microtask fired — callbacks scheduled during `run` wait
for the next flush, avoiding re-entrant mutation of the array being
iterated.

---

## `readyAsync`

Separate from the priority queue. It re-exports `asyncTracking.ready`
from `src/lib/solid.js`:

- Increments/decrements a counter each time `withValue` wraps a
  pending promise.
- When the counter hits zero, runs registered callbacks via a double
  `queueMicrotask` (two microtask ticks) to let any synchronous
  follow-up work queue before the "all async done" signal fires.

`ready` fires after every synchronous render; `readyAsync` waits for
every in-flight `derived`/`withValue` promise to settle first. Use
`readyAsync` when you need to observe the final resolved DOM state
after deeply nested async work.

---

## Timing for tests

The rule of thumb (full list in `tests/readme.md`):

- **`await microtask()`** — flushes the full priority queue. Enough
  for `onProps`, `onMount`, `ready`, lifecycle plugins, and any
  callback that was routed through `add(...)`.
- **`await macrotask()`** — needed when promises chain through more
  than one microtask tick (e.g. `readyAsync`, `action` promise chains,
  `CSSStyleSheet.replace()`).
- **`sleep(ms)`** — only for truly time-dependent browser APIs
  (`history.back()` needs ~200ms, `navigate({delay})` needs ≥2×
  delay).

Namespaced props (`use:*`) registered with the default
`onMicrotask=true` need `await microtask()` after `render()` before
their effect is observable. Built-in props that register with
`onMicrotask=false` (`use:ref`, `use:connected`, `use:disconnected`,
`style`, `class`, `on:*`, `prop:*`) apply immediately.
