# Errored component — design & implementation notes

Notes for `pota/components`' `Errored` export: a classic error
boundary, pota-flavored. Status: **implemented**. Tests live next to
this file at `tests/api/components/errored.jsx`.

## Why

Two long-standing gaps in the codebase converged here:

1. `src/lib/solid.js` had three commented-out `catch (err)` blocks —
   in `Computation.update()`, `Memo.update()`, and `Derived.update()`.
   They were placeholders for error propagation that never got wired
   up.
2. `src/components/route/load.js:23-27` explicitly waits for "pota
   supports error handling" — the current `load()` does its own ad-hoc
   promise wrapping because there is no boundary to escalate to.

`Errored` is the user-facing surface. The reactive-layer plumbing
(`catchError` + context-based error routing) is what those commented
blocks wanted.

## Name

`Errored` (not `Error`, not `ErrorBoundary`).

- Avoids shadowing the global `Error` constructor in user code — so
  `throw new Error('boom')` keeps working inside files that
  `import { Errored } from 'pota/components'`.
- Shorter than `ErrorBoundary`, and reads as a state: "the subtree
  errored, show the fallback".

## API

```jsx
import { Errored } from 'pota/components'

// Static JSX fallback
<Errored fallback={<p>Oops</p>}>
  <MayThrow />
</Errored>

// Function fallback — receives the error + a reset()
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
- `fallback?` — optional. JSX element, text, or
  `(err, reset) => Children` callback. If omitted, an errored subtree
  renders nothing.

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
  currently rendered, including any effects that were created inside
  the subtree before it threw.
- Errors thrown inside cleanup functions during disposal are caught
  and routed to the nearest boundary. Remaining cleanups still run.
- Rejected promises in `derived` (via `withValue`) and `action`
  chains (via `resolve`) are caught and routed to the nearest
  boundary.

### Non-goals

- **Logging / reporting hooks.** Keep the component narrow. Users who
  want telemetry can log inside their own function fallback.
- **Partial-children semantics.** If `<Errored>` contains
  `<a/><Boom/><b/>` and `<Boom/>` throws mid-render, the whole subtree
  is replaced by the fallback — we do not try to keep `<a/>` mounted.
  (This matches React / Solid.)

## Implementation

Three layers landed together.

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
owner-chain walk. Context is inherited at construction time —
children see the handler set by any ancestor. `routeError` just reads
`node.context[errorHandlerId]`.

#### Catch blocks in update methods

Wired up the three previously-commented `catch` placeholders in
`Computation.update()`, `Memo.update()`, and `Derived.update()`.
Each one:

1. Marks `state = STALE`.
2. Calls `this.disposeOwned()` to tear down any partially-built
   children.
3. Sets `this.updatedAt = time + 1` to prevent immediate re-run /
   infinite loop.
4. Calls `routeError(this, err)`.

These catches handle errors during **reactive re-runs** — when a
signal change triggers an effect/memo/derived and its fn throws. The
error aborts the fn (code after the throw does NOT execute), which
gives clean error semantics.

#### Catch in `runWithOwner`

`runWithOwner` wraps `runWith(() => runUpdates(fn, true), owner)` in a
try/catch that calls `routeError(owner, err)`. This covers errors
from **deferred execution** — code that runs outside the original
reactive update cycle:

- `owned()` callbacks (promise `.then`, event handlers)
- `root()` scope setup
- Direct `runWithOwner()` calls from user code

The `owner` argument carries the right context because:
- `root()` creates a new Root that inherits context from its parent
- `owned()` captures the Owner at creation time
- User code passes whatever owner they choose

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

The `syncEffect` creates a sub-owner; setting context on _that_ owner
scopes catching to its descendants only. `untrack(fn)` prevents the
syncEffect from re-triggering on reactive reads inside fn. Wrapping
`fn` in `try/catch` handles the synchronous-throw case during the
first evaluation; reactive throws later route through the update()
catch blocks and find the handler via context.

The handler is wrapped in `safeHandler` to prevent re-entry: if the
handler itself throws, the error escalates to the parent handler
rather than being routed back to the same handler. Without this, a
throwing handler would be called with its own error by `routeError`
(since the handler is stored on the syncEffect's context, and the
syncEffect's `update()` catch calls `routeError(this, err)`).

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

export function Errored(props) {
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

## Follow-ups

- Extend `typescript/exports.d.ts` (or wherever component types live)
  with the `Errored` prop types — currently the component is typed
  via JSDoc only.

## Test coverage

### `tests/api/components/errored.jsx`

| Test                                               | What it proves                |
| -------------------------------------------------- | ----------------------------- |
| renders children when no error                     | happy path                    |
| renders text children when no error                | happy path, text              |
| renders multiple children when no error            | happy path, several nodes     |
| renders nothing when children is empty             | empty subtree                 |
| catches sync throw and shows JSX fallback          | basic catching                |
| catches sync throw and shows text fallback         | fallback can be a string      |
| renders nothing on error when no fallback          | fallback is optional          |
| function fallback is called and result rendered    | function form works           |
| function fallback receives the thrown error        | `err` arg is the actual error |
| non-Error thrown values are still passed           | `throw 'string'` still works  |
| catches throw undefined and shows fallback         | noError sentinel works        |
| reset with fixed cause re-renders children         | recovery path                 |
| reset with persistent cause re-catches             | repeated failure is stable    |
| catches error thrown inside an effect              | reactive throw                |
| catches error thrown inside a memo                 | reactive throw                |
| signal change triggering a thrown effect is caught | reactive retrigger            |
| nested: inner catches, outer renders normally      | inner-first semantics         |
| nested: inner without fallback renders nothing     | no escalation                 |
| sibling boundaries catch independently             | boundary isolation            |
| non-throwing sibling is replaced by fallback       | whole-subtree replacement     |
| dispose from children state cleans up              | cleanup contract              |
| dispose from fallback state cleans up              | cleanup contract              |
| cleanups of errored children still run on dispose  | cleanup ordering              |
| parent reactive content keeps updating             | parent state preservation     |
| sibling components keep rendering                  | sibling state preservation    |
| reactive child error does not break parent         | parent state preservation     |
| catches error thrown by an event handler           | event handler routing         |
| error in fallback not caught by same boundary      | fallback isolation            |
| error in fallback caught by outer boundary         | fallback escalation           |
| catches error thrown inside a derived              | reactive throw                |
| catches error from deeply nested grandchild        | deep nesting sync             |
| catches reactive error from deeply nested          | deep nesting reactive         |
| two boundaries triggered by same signal            | shared signal isolation       |
| dead effect stays dead after throw                 | effect lifecycle              |
| memo error triggered by signal change              | reactive retrigger            |
| derived chain error triggered by signal            | chain stage error             |
| nested: inner catches reactive, outer unaffected   | reactive inner-first          |
| error inside batch is caught                       | batch integration             |

### `tests/api/catch-error.jsx`

| Test                                               | What it proves                |
| -------------------------------------------------- | ----------------------------- |
| fn runs and returns its value                      | happy path                    |
| fn with no error, handler never called             | no false positives            |
| catches sync throw                                 | basic catching                |
| catches non-Error thrown values                    | `throw 'string'` works        |
| returns undefined when fn throws                   | no partial result             |
| catches error thrown inside an effect              | reactive throw                |
| catches effect error triggered by signal           | reactive retrigger            |
| after effect throws, it is dead                    | no re-trigger after death     |
| catches error thrown inside a memo                 | reactive throw                |
| catches memo error triggered by signal             | reactive retrigger            |
| catches error thrown inside a derived              | reactive throw                |
| catches derived chain error on signal              | chain stage error             |
| nested: inner catches before outer                 | inner-first semantics         |
| nested: inner catches reactive before outer        | reactive inner-first          |
| deeply nested: error reaches innermost             | 3-level nesting               |
| sibling scopes catch independently                 | scope isolation               |
| sibling reactive errors stay isolated              | reactive scope isolation      |
| unhandled effect error → console.error             | fallback behavior             |
| unhandled memo error → console.error               | fallback behavior             |
| error does not break sibling effects               | effect isolation              |
| error does not break sibling signal tracking       | signal isolation              |
| cleanups inside scope run on disposal              | cleanup contract              |
| cleanup before sync throw runs on disposal         | cleanup ordering              |
| handler can write to signals                       | handler is reactive           |
| root() inside scope inherits handler               | context inheritance           |
| error inside batch is caught                       | batch integration             |
| throwing + non-throwing siblings                   | mixed children                |
| owned callback error caught by handler             | runWithOwner catch            |
| owned callback error without handler → console     | runWithOwner fallback         |
| disposed owned callback is a no-op                 | owned lifecycle               |
| root throw caught by outer catchError              | runWithOwner catch            |
| root throw without handler → console.error         | runWithOwner fallback         |
| untrack throw aborts the effect fn                 | abort semantics               |
| untrack throw in memo aborts the memo fn           | abort semantics               |
| thrown effect is marked dead                       | update() cleanup              |
| partial children disposed on throw                 | update() cleanup              |
| thrown memo does not write its value               | update() cleanup              |
| parent effect keeps tracking after child error     | parent state preservation     |
| parent memo keeps producing after child error      | parent state preservation     |
| sibling catchError scopes preserve state           | sibling state preservation    |
| parent derived keeps working after child error     | parent state preservation     |
| catchError works nested inside an effect           | effect nesting                |
| two boundaries triggered by same signal            | shared signal isolation       |
| error triggered after async delay                  | async timing                  |
| handler error is not caught by same handler        | no handler re-entry           |
| handler error escalates to parent handler          | handler escalation            |
| reactive handler error escalates to parent         | reactive handler escalation   |
| unbatched reset causes extra memo evaluation       | batch proof (unbatched)       |
| batched reset avoids extra memo evaluation         | batch proof (batched)         |

### `tests/api/promise-rejection.jsx`

| Test                                               | What it proves                |
| -------------------------------------------------- | ----------------------------- |
| catches rejected promise in derived                | basic rejection routing       |
| catches non-Error rejected value                   | `reject('string')` works      |
| catches rejected promise via signal change         | reactive rejection            |
| rejection does not break sibling effects           | sibling isolation             |
| rejection without handler → console.error          | fallback behavior             |
| Errored catches rejection and shows fallback       | DOM-level rejection           |
| rejected promise does not break parent             | parent preservation           |
| promise resolves then rejects on signal change     | reactive rejection            |
| action rejected promise routes to handler          | resolve rejection routing     |
| action rejected promise without handler → console  | resolve rejection fallback    |
| action rejection in chain stage routes to handler  | resolve chain rejection       |

### `tests/api/cleanup.jsx`

| Test                                               | What it proves                |
| -------------------------------------------------- | ----------------------------- |
| runs on disposal                                   | happy path                    |
| multiple cleanups run in reverse order             | execution order               |
| effect cleanup runs when effect re-runs            | effect lifecycle              |
| returned by cleanup() for cancellation             | return value contract         |
| error routes to catchError handler                 | error routing                 |
| error without handler goes to console.error        | fallback behavior             |
| remaining cleanups still run after one throws      | error isolation               |
| all cleanups throw, all errors are routed          | exhaustive routing            |
| error during effect re-run is caught               | reactive cleanup error        |
| error during memo re-evaluation is caught          | memo cleanup error            |
| error does not prevent sibling effects             | sibling preservation          |
| error in nested owned child is caught              | nested error routing          |
| parent reactive state preserved after error        | parent preservation           |
| effect stays alive after its cleanup threw         | effect lifecycle              |
| error when catchError disposes owned on throw      | disposeOwned + cleanup error  |
