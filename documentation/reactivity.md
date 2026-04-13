# Reactivity — design and implementation

This document describes how pota's reactive system works. The core
lives in `src/lib/solid.js` inside `createReactiveSystem()`, a
factory that returns a self-contained set of reactive primitives.
`src/lib/reactive.js` calls the factory once and re-exports
everything as the public API.

The design descends from Solid 1.x but is ported to classes, adapted
to pota's conventions, and extended with features like `derived`,
`owned`, `asyncTracking`, and `catchError`.

Related files:

- `src/lib/solid.js` — the reactive engine
- `src/lib/reactive.js` — public re-exports and higher-level helpers
  (`map`, `resolve`, `signalFunction`, etc.)
- `documentation/derived.md` — deep-dive on `Derived` specifically

---

## Global state

Five module-level variables drive the entire system:

| Variable    | Type                    | Purpose                                                       |
| ----------- | ----------------------- | ------------------------------------------------------------- |
| `Owner`     | `Computation \| undefined` | Current ownership scope — new computations attach here     |
| `Listener`  | `Computation \| undefined` | Current tracking scope — signal reads register here        |
| `Updates`   | `Memo[] \| undefined`     | Queue of memos to flush during a batch                     |
| `Effects`   | `any[] \| undefined`      | Queue of effects to flush after memos                      |
| `Time`      | `number`                  | Monotonic clock — incremented once per batch               |

`Owner` and `Listener` are separate concepts. `Owner` controls
lifetime (disposal, cleanups, context inheritance). `Listener`
controls tracking (which signals are observed). They are often the
same node (an effect is both owner and listener when its `fn` runs),
but can diverge — `untrack` clears `Listener` while keeping `Owner`,
so cleanups still register on the running computation but signal
reads do not.

---

## Node hierarchy

```
Root
 └─ Computation  (extends Root)
     ├─ Effect        (extends Computation, user = true)
     ├─ SyncEffect    (extends Computation)
     └─ Memo          (extends Computation)
         └─ Derived   (extends Memo)
```

### Root

The ownership node. Holds:

- `owner` — parent in the ownership tree
- `owned` — child computations (single or array; lazily promoted)
- `cleanups` — disposal callbacks (single or array; lazily promoted)
- `context` — inherited context record (symbol-keyed)

`dispose()` disposes owned children first (in reverse order), then
runs cleanups (in reverse order). This ensures children always
clean up before parents.

The `owned` and `cleanups` fields use a single-value → array
promotion pattern: when there's one item it's stored directly,
when a second item arrives it becomes an array. This avoids
allocating arrays for the very common case of zero or one entry.

### Computation

Extends `Root` with reactivity:

- `state` — tri-state flag: `CLEAN (0)`, `STALE (1)`, `CHECK (2)`
- `updatedAt` — timestamp of last update (compared against `Time`)
- `fn` — the user function to re-run
- `sources` / `sourceSlots` — signals this computation reads
- `observers` / `observerSlots` — (only on `Memo`) computations
  that read this node

On `update()`, a computation first disposes itself (unlinks from
sources, disposes owned children and cleanups), then re-runs `fn`
with itself as both `Owner` and `Listener`. This is the
re-execution cycle: every re-run starts clean.

`queue()` pushes the computation into the appropriate queue —
`Effects` for effects, `Updates` for memos. This is how the system
separates memo propagation from effect execution.

### Signal

Not a class — a closure-based factory. `signal(value, options)`
returns a tuple `[read, write, update]` with the same functions
also available as `.read`, `.write`, `.update` properties.

The signal's observer tracking state (`observers`,
`observerSlots`) lives on a plain object `o` captured in the
closure. The value itself is a local variable, not a property.

- `read()` — calls `doRead(o)` if there's a `Listener`, returns
  the value.
- `write(val)` — compares with the equality function, updates the
  value, calls `doWrite(o)` to notify observers. Returns `true` if
  the value changed.
- `update(fn)` — calls `write(untrack(() => fn(value)))`. The
  `untrack` prevents the updater function from accidentally
  tracking itself.

Equality is `===` by default. Passing `{ equals: false }` disables
comparison (always notifies). A custom `equals` function can also
be provided.

---

## Tracking: doRead and doWrite

### doRead — subscription

When a signal (or memo) is read inside a tracking scope
(`Listener` is set), `doRead` wires up a bidirectional link:

```
signal.observers[sourceSlot] = listener
signal.observerSlots[sourceSlot] = observerSlot

listener.sources[observerSlot] = signal
listener.sourceSlots[observerSlot] = sourceSlot
```

The slot indices enable O(1) unlinking during disposal: when a
computation disposes, it walks its `sources` array and
swap-removes itself from each signal's `observers` using the
stored slot indices.

### doWrite — notification

When a signal's value changes, `doWrite` runs inside
`runUpdates()`. It walks the signal's `observers`:

1. If the observer is `CLEAN`, it calls `observer.queue()` (pushes
   it to either `Updates` or `Effects`) and then calls
   `downstream(observer)` to mark transitive dependents as `CHECK`.
2. **All** observers are set to `STALE` — not just clean ones.
   Observers already in `CHECK` get upgraded to `STALE` (they now
   *definitely* need to re-run, not just maybe). Observers already
   `STALE` stay `STALE`. Only `CLEAN` observers need queuing
   because `CHECK` and `STALE` observers are already in a queue.

The `downstream` function recursively marks observers of observers
as `CHECK` (not `STALE`). This is the "maybe dirty" optimization:
a memo that depends on another memo doesn't know yet whether its
source's value actually changed — it only knows its source *might*
have changed. The `CHECK` state defers the decision until the memo
is actually read or flushed.

---

## The update cycle: runUpdates

`runUpdates(fn)` (aliased as `batch`) is the heart of the flush
algorithm. Every signal write goes through it.

### Entry

```js
function runUpdates(fn, init = false) {
    if (Updates) {
        return fn()   // already inside a batch — just run
    }
    // ...
}
```

If `Updates` already exists, we're nested inside an outer batch.
The function runs immediately and its notifications accumulate in
the existing queues. This is how batching works — the outermost
`runUpdates` owns the flush.

### Setup

```js
if (!init) Updates = []
if (Effects) { wait = true } else { Effects = [] }
Time++
```

- `Updates` is created (unless `init` — used by `runWithOwner`).
  When `init = true`, `Updates` stays `undefined`, so each signal
  write inside `fn` creates its own mini-batch for memo flushes
  rather than accumulating in one shared queue. Effects still
  collect in the outer `Effects` queue for a single flush at the end.
- If `Effects` already exists, we're nested — set `wait = true` so
  we don't flush effects prematurely.
- `Time` increments. This is the global clock that prevents
  double-updates within a single batch.

### Flush

```js
const res = fn()

// Phase 1: flush memos
for (const update of Updates) {
    runTop(update)
}
Updates = undefined

// Phase 2: flush effects (only if outermost batch)
if (!wait) {
    const effects = Effects
    Effects = undefined
    effects.length && runUpdates(() => runEffects(effects))
}
```

**Phase 1** processes all queued memos. Memos are flushed first
because effects may read memo values — the dependency graph must
be consistent before any side effects run.

**Phase 2** processes effects, but only at the outermost batch
boundary. Effects are flushed via a recursive `runUpdates` call,
which means memo notifications triggered by effects get their own
flush cycle. This ensures the system is always consistent: memos
before effects, always.

### runEffects — two-pass execution

```js
function runEffects(queue) {
    let userLength = 0
    for (const effect of queue) {
        if (effect.user) {
            queue[userLength++] = effect
        } else {
            runTop(effect)
        }
    }
    for (let i = 0; i < userLength; i++) {
        runTop(queue[i])
    }
}
```

Effects are split into two categories:

- **Internal effects** (`user = false`, i.e. `SyncEffect`) —
  run first. These are used by the framework itself (context
  setup, `catchError`, etc.).
- **User effects** (`user = true`, i.e. `Effect`) — run second.
  These are the effects the user creates with `effect()`.

This ordering guarantees that framework-level setup (like context
injection) completes before user code observes it.

### runTop — ancestor-first execution

When a computation is marked `STALE`, it may have ancestors that
are also stale. `runTop` walks up the ownership chain to find
the topmost stale ancestor, collects all stale nodes along the
path, then updates them top-down:

```js
function runTop(node) {
    // ...
    const ancestors = []
    do {
        node.state && ancestors.push(node)
        node = node.owner
    } while (node && node.updatedAt < Time)

    for (let i = ancestors.length - 1; i >= 0; i--) {
        node = ancestors[i]
        switch (node.state) {
            case STALE:  node.update(); break
            case CHECK:  upstream(node); break
        }
    }
}
```

This ensures parent computations update before children. Without
this, a child might re-run with stale parent values, then
re-run again when the parent updates — wasted work.

### upstream — the CHECK resolution

When a memo is in `CHECK` state, `upstream` resolves it. The
mechanism: `upstream` sets the node `CLEAN` first, then walks its
sources. If any source is `STALE`, it gets updated via `runTop`
(which may change its value). If a source is `CHECK`, `upstream`
recurses into it. If a source update causes the source's value to
change, `doWrite` naturally re-marks our node `STALE` and
re-queues it — the push system does the work. If no source value
actually changed, the node stays `CLEAN` and never re-executes
its function.

This is the "pull" half of the push-pull system. `doWrite` pushes
`STALE`/`CHECK` marks through the graph. `upstream` lazily pulls
by resolving `CHECK` nodes only when needed, relying on the push
mechanism (`doWrite`) to re-mark the node `STALE` if re-execution
is actually required.

### downstream — marking transitive dependents

```js
function downstream(node) {
    for (const observer of node.observers) {
        if (observer.state === CLEAN) {
            observer.state = CHECK
            observer.queue()
            observer.observers && downstream(observer)
        }
    }
}
```

When a memo is marked `STALE` (its source changed), its own
observers are marked `CHECK` (they *might* need to update, but
only if this memo's value actually changes). This avoids eagerly
propagating staleness through long chains — most of the graph
stays in `CHECK` and may never need to re-execute.

---

## Effect vs SyncEffect

Both extend `Computation`. The difference is in construction and
scheduling:

**Effect** (`user = true`):

```js
constructor(owner, fn, options) {
    super(owner, fn, options)
    Effects ? Effects.push(this) : batch(() => this.update())
}
```

If there's an active batch (`Effects` exists), the effect queues
itself for later. Otherwise it creates its own batch and runs
immediately. User effects are always deferred to the end of the
flush cycle (after memos).

**SyncEffect** (`user` defaults to `false`):

```js
constructor(owner, fn, options) {
    super(owner, fn, options)
    batch(() => this.update())
}
```

Always runs immediately in its own batch. Used internally for
`context()` setup, `catchError`, and similar framework plumbing
that must complete synchronously before user code sees the scope.

---

## Memo

A `Memo` is a computation that also acts as a signal — it has
`observers` and `observerSlots`, so other computations can track
it. This is the glue that makes the dependency graph work: a memo
reads signals (tracking them as sources) and is itself readable
(other computations track it as a source).

```js
read = () => {
    if (this.state === STALE)  this.update()
    else if (this.state === CHECK) {
        // resolve upstream without running full batch
        const updates = Updates
        Updates = undefined
        runUpdates(() => upstream(this))
        Updates = updates
    }
    doRead(this)
    return this.value
}
```

On read:

- `STALE` → re-runs the function immediately (eager evaluation
  on access).
- `CHECK` → resolves via `upstream` to determine if re-run is
  needed.
- `CLEAN` → returns cached value.

The `Updates` save/restore around the `upstream` call prevents
memo resolution from contaminating an outer batch's memo queue.

`Memo.update()` differs from `Computation.update()` in that it
writes its return value via `this.write(nextValue)`, which
compares against the previous value. If the value didn't change,
downstream observers stay `CHECK` or `CLEAN` — they never
re-execute. This is what makes memos an optimization boundary.

---

## Disposal and re-execution

When a computation re-runs (`update()`), the first thing it does
is `dispose()`:

1. **Unlink from sources** — walks `this.sources`, swap-removes
   itself from each source's `observers`. This is O(n) in the
   number of sources, using the slot indices for O(1) per removal.

2. **Dispose owned children** — recursively disposes child
   computations (reverse order).

3. **Run cleanups** — executes cleanup callbacks (reverse order).

4. **Set state to CLEAN**.

Then `fn` runs fresh, establishing new source subscriptions. This
means every re-execution is a clean slate for tracking — if a
conditional branch no longer reads a signal, the subscription is
automatically removed. No manual dependency management needed.

### Disposal order

The order matters: owned children first, then cleanups. Children
dispose in reverse creation order (LIFO). Cleanups also run in
reverse registration order. This gives predictable tear-down
semantics — things created last are destroyed first.

---

## Ownership and context

### Owner

Every computation is owned by the computation (or root) that was
active when it was created. This forms a tree:

```
root
├── effect A
│   ├── memo B
│   └── effect C
└── effect D
```

Disposing a node disposes its entire subtree. This is how
component-level cleanup works — when a component's root effect is
disposed, all nested computations, memos, and effects are
automatically torn down.

### Context

Context is a symbol-keyed record on the owner node, inherited by
copying the parent's record (with spread) when a new context
value is set:

```js
Owner.context = { ...Owner.context, [id]: newValue }
```

Context lookup walks up `Owner.context` — since each node either
inherits its parent's `context` reference or has its own
augmented copy, reads are O(1) property lookups.

`context()` creates a unique symbol and returns a `useContext`
function that reads from or writes to that symbol on the current
owner's context. Context providers use `syncEffect` to ensure
the context is set synchronously before children execute.

---

## Untrack, cleanup, owned

### untrack(fn)

Runs `fn` with `Listener = undefined` but `Owner` unchanged.
Signal reads inside `fn` don't create subscriptions, but
cleanups and child computations still attach to the current
owner. This is the escape hatch for reading a signal's value
without tracking it as a dependency.

### cleanup(fn)

Registers `fn` to run when the current `Owner` is disposed or
re-executed. Returns `fn` for convenience. Cleanups are stored
on the owner node and run in reverse order during disposal.

### owned(cb, onCancel)

Returns a wrapper function that:

- Only runs `cb` if the owner hasn't been disposed yet.
- Runs `cb` inside `runWithOwner`, so it has access to the
  original owner's context and cleanup scope.
- If the owner is disposed before the wrapper is called,
  `onCancel` runs instead (if provided).

This is essential for async callbacks — a promise's `.then()`
handler may fire after the computation that created it has been
disposed. `owned` makes these callbacks disposal-aware.

---

## catchError

```js
function catchError(fn, handler) {
    syncEffect(() => {
        Owner.context = {
            ...Owner.context,
            [errorHandlerId]: safeHandler,
        }
        result = untrack(fn)
    })
    return result
}
```

Creates a `syncEffect` that injects an error handler into the
context. The handler is looked up via `routeError(node, err)`,
which walks up the context chain. If no handler is found, errors
fall through to `console.error`.

The handler itself is wrapped to catch errors in the handler —
if the handler throws, the error is routed to the *parent's*
handler, preventing infinite error loops.

`fn` runs untracked — `catchError` is an error boundary, not a
reactive boundary. Reactivity inside `fn` comes from whatever
computations `fn` creates, not from `catchError` itself.

---

## withValue — recursive unwrapping

`withValue(value, fn)` is the engine behind `derived`'s ability to
handle functions, promises, and arrays transparently:

- **Function** → creates an `effect` that calls the function and
  recurses with its return value. This means reactive functions
  are automatically tracked.
- **Array** → recurses into each element, waiting for all to
  resolve, then recurses with the fully-resolved array.
- **Promise** → calls `owned()` on the resolution handler (so
  it's disposal-aware), writes a default value while pending,
  then recurses with the resolved value.
- **Anything else** → calls `fn(value)` directly.

The `wroteValue` flag prevents double-writing: if the value
resolves synchronously (no promises), no intermediate default is
written. The `resolved` array prevents infinite recursion on
arrays that have already been visited.

---

## asyncTracking

A reference-counting system for tracking in-flight async work:

- `add()` — increments the count, returns a `remove` function.
- `ready(fn)` — registers a callback that fires when the count
  drops to zero.

The ready callbacks are dispatched via double `queueMicrotask`
(two microtask ticks) to allow synchronous follow-up work to
complete before the "all async done" signal fires.

Used by `Suspense` and `derived`'s promise handling to know when
all pending async operations have settled.

---

## Summary: the lifecycle of a signal write

1. **`signal.write(value)`** — compares with equality, stores
   the new value, calls `doWrite`.

2. **`doWrite`** — enters `runUpdates` (batch), iterates
   observers. Clean observers are queued and have their transitive
   dependents marked `CHECK` via `downstream`. All observers
   (clean, check, or already stale) are set to `STALE`.

3. **Phase 1: memo flush** — each queued memo is processed via
   `runTop`, which walks up to the topmost stale ancestor and
   updates top-down. Memos compare old and new values; if
   unchanged, downstream nodes stay clean.

4. **Phase 2: effect flush** — framework effects
   (`SyncEffect`) run first, then user effects (`Effect`).
   Each effect re-runs its function, establishing fresh
   subscriptions.

5. **Nested writes** — if an effect writes to a signal during
   its execution, this triggers a nested `runUpdates` that
   accumulates in the existing `Effects` queue. The outermost
   batch flushes everything.

The result is a synchronous, deterministic, glitch-free update:
all memos are consistent before any effect sees the new state,
and effects run at most once per batch regardless of how many
of their dependencies changed.
