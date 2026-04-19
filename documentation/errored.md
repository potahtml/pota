# Errored component — design & implementation notes

Notes for `pota/components`' `Errored` export: a classic error
boundary, pota-flavored. The name avoids shadowing the global
`Error` constructor in user code. Tests at
`tests/api/components/errored.jsx`.

## API

```jsx
import { Errored } from 'pota/components'

<Errored fallback={(err, reset) => (
  <div>
    <p>{err.message}</p>
    <button on:click={reset}>retry</button>
  </div>
)}>
  <MayThrow />
</Errored>
```

### Props

- `children` — the protected subtree.
- `fallback?` — JSX element, text, or `(err, reset) => Children`
  callback. If omitted, an errored subtree renders nothing.

### Behaviour contract

- Synchronous throws during the initial render of `children` are
  caught.
- Reactive throws during `effect` / `memo` / `derived` updates inside
  the subtree are caught and routed to the nearest boundary.
- Errors from deferred callbacks (`owned` — promise `.then`) are
  caught via `runWithOwner` and routed to the nearest boundary.
- **Event handler errors are caught.** `on:click` and other event
  props go through `ownedEvent` → `owned` → `runWithOwner`, so a
  throw inside a click handler routes to the nearest `Errored`
  boundary.
- Errors thrown by siblings _outside_ the `Errored` subtree are NOT
  caught — `Errored` only protects its own descendants.
- `reset()` clears the captured error and re-runs `children`. If the
  underlying cause is still broken, the error is re-caught and the
  fallback stays up.
- Sibling `Errored` boundaries catch independently; a throw in one
  never leaks into another.
- Nesting: an inner `Errored` catches before an outer one. If an inner
  `Errored` itself has no fallback, it renders nothing — it does NOT
  re-throw to the outer. Users wanting escalation should omit the
  inner boundary.
- Disposal cleans up whichever state (children or fallback) is
  rendered, including effects created inside the subtree before
  it threw.
- Errors thrown inside cleanup functions during disposal are caught
  and routed to the nearest boundary. Remaining cleanups still run.
- Rejected promises are caught and routed to the nearest boundary,
  regardless of how they reach the renderer:
  - inside `derived` (via `withValue`),
  - inside `action` chains (via `resolve`),
  - as a bare promise child (e.g. a component that returns
    `new Promise(...)` or `{somePromise}` in JSX — the renderer's
    promise branch chains an `owned` rejection handler).

### Non-goals

- **Logging / reporting hooks.** Keep the component narrow. Users who
  want telemetry can log inside their own function fallback.
- **Partial-children semantics.** If `<Errored>` contains
  `<a/><Boom/><b/>` and `<Boom/>` throws mid-render, the whole subtree
  is replaced by the fallback — we do not try to keep `<a/>` mounted.
  (This matches React / Solid.)

## Implementation

### 1. Reactive core — `src/lib/solid.js`

#### Error routing via context

Error handling uses the existing `context` inheritance mechanism.
A private `Symbol` (`errorHandlerId`) is created inside
`createReactiveSystem`. A standalone `routeError(node, err)` does a
single O(1) context lookup:

```js
const errorHandlerId = Symbol()

function routeError(node, err) {
    const handler = node.context && node.context[errorHandlerId]
    if (handler) handler(err)
    else console.error(err)
}
```

No `errorHandler` property on `Root`, no `handleError` method, no
owner-chain walk — context inheritance does the work.

#### Catch blocks in update methods

The three previously-commented `catch` placeholders in
`Computation.update()`, `Memo.update()`, and `Derived.update()` are
now wired up. Each marks `state = STALE`, calls `disposeOwned()` to
tear down partially-built children, bumps `updatedAt = time + 1`
(prevents immediate re-run), then `routeError(this, err)`. These
catch errors during **reactive re-runs** — the fn is aborted, code
after the throw does not execute.

#### Catch in `runWithOwner`

`runWithOwner` wraps its body in try/catch and routes via
`routeError(owner, err)`. This covers errors from **deferred
execution** outside the original reactive update cycle: `owned()`
callbacks (promise `.then`, event handlers), `root()` scope setup,
and direct `runWithOwner()` calls.

#### Why `runWith` does NOT catch

`runWith` is called by the update methods (`runWith(this.fn, this,
this)`) and by helpers like `untrack`. If `runWith` caught errors,
nested calls like `untrack(() => { throw })` inside an effect would
have the error caught at the wrong level — the effect's fn would
continue running in a broken state instead of being aborted by the
update() catch block.

The two catch levels handle different phases:
- **update() catch**: errors during reactive re-runs → fn is aborted,
  node is cleaned up
- **runWithOwner catch**: errors during deferred execution → no node
  cleanup needed, just error routing

#### `catchError` primitive

```js
function catchError(fn, handler) {
    let result
    syncEffect(() => {
        const parentHandler =
            Owner.context && Owner.context[errorHandlerId]

        const safeHandler = err => {
            try {
                handler(err)
            } catch (handlerErr) {
                if (parentHandler) parentHandler(handlerErr)
                else console.error(handlerErr)
            }
        }

        Owner.context = {
            ...Owner.context,
            [errorHandlerId]: safeHandler,
        }
        try {
            result = untrack(fn)
        } catch (err) {
            Owner.disposeOwned()
            safeHandler(err)
        }
    })
    return result
}
```

The `syncEffect` creates a sub-owner; setting context on _that_
owner scopes catching to its descendants only. `untrack(fn)` keeps
the syncEffect from re-triggering on reactive reads inside fn. The
inline `try/catch` handles synchronous throws during the first
evaluation; reactive throws later route through the `update()`
catch blocks and find the handler via context.

`safeHandler` prevents re-entry — if the handler itself throws, the
error escalates to the parent handler instead of looping back
through `routeError` (which would otherwise hit the same handler,
since it's stored on the syncEffect's own context).

#### Error-safe cleanup

`Root.doCleanups()` wraps each user-provided cleanup function in a
try/catch and routes errors via `routeError(this, err)`. This ensures:

- A throwing cleanup does not prevent remaining cleanups from running.
- Cleanup errors do not crash `Computation.update()` (which calls
  `this.dispose()` before the try block).
- Cleanup errors are routed to the nearest error boundary, not lost.

### 2. Component — `src/components/Errored.js`

```js
const noError = Symbol()

/** @type {FlowComponent<{ fallback?: ... }>} */
export const Errored = props => {
  const [err, writeErr] = signal(noError)
  const [attempt, , updateAttempt] = signal(0)

  const fallback = makeCallback(props.fallback)

  const reset = () => {
    batch(() => {
      writeErr(noError)
      updateAttempt(n => n + 1)
    })
  }

  const children = memo(() => {
    attempt()
    return catchError(
      () => toHTMLFragment(props.children),
      writeErr,
    )
  })

  return memo(() => {
    const e = err()
    if (e !== noError) return fallback(e, reset)
    return children()
  })
}
```

Notes on the shape:

- **Why two memos.** The inner `children` memo materializes the
  subtree with `toHTMLFragment` and owns any effects/memos created
  along the way. `catchError` sets the error handler context on a
  syncEffect inside the memo. The outer memo tracks `err` and swaps
  between children and fallback — this separation means writing `err`
  from inside the inner memo doesn't re-trigger itself.
- **Why `attempt`.** Reset needs to force the inner memo to re-run
  in a fresh scope (fresh `dispose()` of the last attempt's owned
  computations). Tracking `attempt()` gives a clean re-run trigger;
  `reset()` bumps it after clearing `err`.
- **Why `batch` in `reset`.** `reset()` writes two signals:
  `writeErr(noError)` and `updateAttempt(n + 1)`. When called from
  an event handler (via `ownedEvent` → `owned` → `runWithOwner`),
  `runUpdates(fn, true)` does not set `Updates`, so each signal
  write creates its own update cycle. Without `batch`, the outer
  memo re-evaluates twice — once seeing stale children (`undefined`
  from the error), then again with fresh children. `batch` makes it
  a single atomic transition.
- **Why `noError` sentinel.** Using `undefined` as the "no error"
  state fails for `throw undefined` — the signal doesn't change, and
  the boundary silently swallows the error. A module-level `Symbol()`
  is compared with `!==`; any thrown value (including `undefined`)
  differs from the sentinel and triggers the fallback.
- **Fallback resolution.** `makeCallback(props.fallback)` handles
  all fallback types uniformly — function fallbacks are called with
  `(err, reset)`, JSX elements and strings are returned as-is,
  undefined (no fallback) renders nothing. Same pattern used by
  `Show` and `Switch`.

### Exports / barrel

- `src/components/@main.js` re-exports `Errored` alongside other
  built-ins.
- `catchError` is exposed from `pota` directly (via
  `src/exports.js`).

## Test coverage

- `tests/api/components/errored.jsx` — `Errored` component
  (children/fallback variants, reset, reactive throws, nesting,
  sibling isolation, disposal, event handlers).
- `tests/api/reactivity/catch-error.jsx` — `catchError` primitive
  (sync + reactive throws, inner-first, handler escalation,
  cleanup, `untrack` abort, `runWithOwner` paths).
- `tests/api/reactivity/cleanup.jsx` — cleanup error routing
  (disposal order, throwing cleanups, sibling preservation).
- Rejected promise routing — split across the three files above
  plus `tests/api/reactivity/derived.jsx` and
  `tests/api/reactivity/action.jsx`. No standalone
  `promise-rejection.jsx`; coverage lives alongside the primitive
  that triggers it.

Rejected promises route through `withValue` → `owned` →
`routeError`.
