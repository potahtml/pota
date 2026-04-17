# derived — design and implementation

`derived(...fns)` is a writable reactive primitive that lazily
unwraps functions and promises. It extends `Memo` which extends
`Computation`. This document is a reference for its internals.

Related files:

- `src/lib/solid.js` — `Derived`, `Memo`, `Computation`, `withValue`
- `src/lib/reactive.js` — re-export wiring
- `src/use/bind.js` — primary user-facing consumer (`bind` wraps
  `derived`)
- `tests/api/reactivity/derived.jsx` — primary regression tests
  (signal semantics, promise unwrapping, `lastWrite` token behavior)
- `tests/api/reactivity/derived-chain-current.jsx` — baseline
  regression tests
- `tests/api/reactivity/derived-chain-expected.jsx` — per-stage
  re-run and user-write override tests. Run explicitly with
  `npm test -- derived-chain-expected`

## Public shape

```js
const d = derived(fn0, fn1, fn2, ...)
```

- `d()` — reads the current value (tracking in reactive scopes).
- `d(value)` — writes an explicit value, bypassing `fn0..n`
  until a tracked dependency of a stage fires a re-run.
- `await d` — thenable; resolves once the derived has committed
  any pending async stage.
- `isResolved(d)` — `true` after the derived has committed at
  least once.

The single-argument form `derived(fn)` is the common case and is
what `bind(value)` uses.

## How `Derived` works

### Chain representation

`derived(f0, f1, f2)` stores `this.fn = [f0, f1, f2]`. There is
no explicit "chain" data structure — the chain is the array.

### Update path (`Derived.update`)

```js
update() {
    this.dispose()
    const time = Time
    try {
        this.lastWrite = {}
        runWith(this._runFn, this, this)
    } catch (err) {
        this.state = 1 /* STALE */
        this.disposeOwned()
        this.updatedAt = time + 1
        routeError(this, err)
    }
}

_runFn = () => {
    this.write(this.fn[0](), this.fn.slice(1))
}
```

`runWith(fn, owner, listener)` sets `Owner = Listener = this`, so
signals read during `this.fn[0]()` register **this Derived** as
an observer. `_runFn` is a pre-bound arrow so `runWith` can
dispatch without rebinding on every run. It calls
`this.write(result, [f1, f2])` — the remaining functions are
passed as the `fns` tail, which starts the recursive chain
dispatch.

`this.lastWrite = {}` stamps a fresh token once for the entire
chain run. All stages share this token.

### Write path (`Derived.write`)

```js
write(nextValue, fns) {
    this.isResolved = undefined

    const mine =
        fns === undefined
            ? (this.lastWrite = {})
            : this.lastWrite

    withValue(
        nextValue,
        nextValue => {
            if (Listener || this.lastWrite === mine) {
                if (fns && fns.length) {
                    this.write(
                        () => fns[0](nextValue),
                        fns.slice(1),
                    )
                } else {
                    this.isResolved = null
                    this.writeNextValue(nextValue)
                    this.updatedAt = Time
                    this.state = 0 /* CLEAN */
                    this.resolve && this.resolve(this)
                }
            }
        },
        () => {
            this.thenRestore()
            this.writeNextValue(nothing)
        },
    )
}
```

### Token: `lastWrite`

Each top-level user write (`fns === undefined`) stamps a fresh
object reference onto `this.lastWrite`. The commit callback
closes over its own `mine` and only proceeds when
`Listener || this.lastWrite === mine`.

This closes two races:

1. **Late-arriving promise clobbers a newer sync write.** A
   promise was written first, a sync value was written second
   (which committed and assigned a new token). When the promise
   finally resolves (outside any tracking scope, so `Listener`
   is undefined), its commit callback's `mine` no longer matches
   `lastWrite`, so the stale value is dropped.

2. **Two pending promises, older resolves last.** The second
   promise's commit was legal (its token was current at its
   resolution time). The first promise's token is now stale, so
   its later resolution is rejected.

Covered by tests under `tests/api/reactivity/derived.jsx` —
search for `stale-promise rejection` and the
`lastWrite token` section.

### Chain re-runs: `Listener` check

For multi-stage chains, intermediate stages create tracking
effects via `withValue`'s function path. When a dependency of
an intermediate stage changes, the effect re-runs — and
`Listener` is set to that effect.

The commit check `Listener || this.lastWrite === mine` allows
chain effect re-runs to always proceed, because:

- **Inside an effect re-run** (`Listener` is set): the reactive
  system triggered this re-run because a dependency changed.
  This is always a legitimate commit, even if a user write
  changed `lastWrite` since the chain was set up.

- **Outside an effect** (`Listener` is undefined): this is a
  promise resolution or other async callback. It must pass
  the `lastWrite === mine` check to commit.

This gives the correct semantics:

- **User write then dep change**: `d(999)`, then a chain dep
  changes → the chain re-runs from the affected stage onward,
  overwriting the user value. Dep changes are authoritative.
- **User write then stale promise**: `d(999)`, then an old
  promise resolves → the promise is rejected. User value stays.
- **Chain re-runs skip unaffected stages**: writing to `baseB`
  (read by `f1`) re-runs `f1` and downstream, but not `f0`.

### Chain tail: `fns.slice(1)`

Each stage dispatches to the next via
`this.write(() => fns[0](nextValue), fns.slice(1))`. The
`slice(1)` creates a fresh array for each stage's closure, so
re-runs always have the correct remaining chain — unlike
`shift()` which mutated the shared array and caused re-runs
to lose their tail.

## Per-stage re-runs

For `derived(f0, f1, f2)` the behavior is:

> If a dependency of a stage changes, only re-run from that
> stage to the end. Earlier stages are not re-run — their
> cached results are still valid.

Concretely, with
`derived(() => A.read(), v => v + B.read(), v => v * 2)`:

| Event | Re-runs | New value |
|-------|---------|-----------|
| initial read | f0, f1, f2 | `(A + B) * 2` |
| `A.write(5)` | f0, f1, f2 | `(5 + B) * 2` |
| `B.write(20)` | f1, f2 (not f0) | `(A + 20) * 2` |
| unrelated signal write | — | unchanged |

### User write override

When the user writes `d(value)`, the value is set directly.
The chain effects remain alive. When any chain dependency
changes, the chain re-runs from the affected stage onward and
the result overwrites the user's value. The user write is a
temporary override, not a permanent one.

## Tests

- `tests/api/reactivity/derived.jsx` — primary regression
  tests: read/write, promise unwrapping, async token semantics,
  `await d` thenable, `isResolved`.

- `tests/api/reactivity/derived-chain-current.jsx` — baseline
  regression tests: single-stage, multi-stage pure, multi-stage
  with intermediate deps, unrelated signal isolation.

- `tests/api/reactivity/derived-chain-expected.jsx` — per-stage
  re-run tests, multi-hop chains, user write override semantics,
  value correctness. Run explicitly:

  ```
  npm test -- derived-chain-expected
  ```
