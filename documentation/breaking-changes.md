# pota v0.20.230

- **`Collapse` no longer renders a `<pota-collapse>` custom element.**
  The component now wraps children in a plain `<div>` whose inline
  `display` toggles between `contents` (visible) and `none` (hidden),
  with fallback mounted as a sibling node. Consumers that queried
  `pota-collapse` or walked its `shadowRoot` need to target the
  wrapper `<div>` directly (or add their own marker attribute).
  Semantically unchanged: children stay mounted across toggles so
  reactive subscriptions, form values, and scroll position are
  preserved. Fallback is now real reactive JSX instead of stringified
  `innerHTML`.

# pota v0.20.229

- **Bare promise children now route rejections to error boundaries.**
  The renderer's async-child branch in `createChildren` previously
  called `child.then(onResult)` with no rejection handler, so a
  component returning `new Promise(...)` (or `{somePromise}` in JSX)
  that rejected became an unhandled rejection and the Suspense
  fallback stayed stuck. Now
  `child.then(onResult, owned(err => { remove(); throw err }))`
  re-throws in the captured owner's scope and routes the rejection
  through `runWithOwner` → `routeError`.

# pota v0.20.228

- **Boolean children no longer render as text.** Previously,
  `<p>{true}</p>` rendered `<p>true</p>`. Now booleans render as
  nothing at every level:
  - Literal `{true}` / `{false}` in JSX markup are filtered out at
    compile time by the Babel preset — they never reach the runtime.
  - Dynamic booleans (e.g. the `false` from `{cond && <X/>}`
    short-circuits) are suppressed by `createChildren` at runtime.
    This aligns pota with React / Solid intuition: `{cond && <X/>}`
    now renders nothing when `cond` is falsy, instead of printing
    `"false"` as a text node. If you need to render a boolean as text,
    wrap it explicitly: `{String(value)}`.
- **`Derived.write()` now marks the derived as CLEAN after committing
  the user-written value.** Previously, calling `write()` before the
  first `read()` would silently discard the write — the next read
  re-ran the original derivation function and clobbered the value.
  This was most visible via `bind(...)`:
  ```js
  const v = bind('a')
  v('changed')
  v() // used to return 'a', now returns 'changed'
  ```
  Reading first and then writing was already fine; this fix makes the
  two orderings consistent.
- **`Derived.write()` now rejects stale async commits via a per-write
  token.** Each call to `write()` stamps a fresh token onto the
  derived, and async commit callbacks (a promise's `.then`, a
  function-unwrap effect) only commit if the token is still current.
  Previously, a late-arriving promise whose derived had since been
  overwritten by a newer sync write or a newer promise would clobber
  the newer value:
  ```js
  const d = derived(() => pendingPromise)
  d() // registers the promise
  d('manual') // sync override visible immediately
  // …pendingPromise resolves later…
  d() // used to return the resolved value,
  // now correctly returns 'manual'
  ```
  Same fix applies when two promises are in flight and the older one
  resolves last — the stale token is rejected.
- **Multi-stage `derived` chains now re-run per-stage.** Previously,
  `derived(f0, f1, f2)` would only fully re-run when `f0`'s
  dependencies changed. If an intermediate stage (`f1`) read its own
  signal and that signal changed, the re-run was silently dropped —
  the value stayed stale. Now each stage tracks its own dependencies
  and re-runs from the affected stage onward, skipping earlier stages
  whose cached results are still valid.
- **User writes to a `derived` are overwritten by dependency
  changes.** Writing `d(999)` sets the value immediately, but when any
  chain dependency changes, the chain re-runs from the affected stage
  and the result overwrites the user value. User writes are a
  temporary override, not a permanent one. Stale promise rejection
  still works: `d(promise)` then `d('manual')` — the promise is
  rejected when it resolves.
- **`withValue` array handling fixed for mixed sync/async items.**
  Previously, when an array contained sync primitives before async
  items (e.g. `['sync', Promise.resolve('async')]`), the pending
  counter could hit zero prematurely and commit a partially resolved
  array. Now the counter is initialized to the array length upfront.
  Empty arrays (`[]`) also now resolve correctly instead of leaving
  the derived stuck at its placeholder value.
- **Empty JSX fragments (`<></>`) compile to `null`.** The Babel
  preset previously crashed on empty fragments with
  `path.replaceWith() a falsy node`. Now they produce `null`, which
  the renderer correctly treats as "nothing".
- **Rejected promises in `derived` now route to error boundaries.**
  Previously, a rejected promise passed to `derived` (or returned by a
  `derived` stage) became an unhandled promise rejection. Now
  `withValue` chains a rejection handler via `owned` → `runWithOwner`,
  routing the rejection to the nearest `catchError` / `Errored`
  boundary, or to `console.error` if no boundary exists.
  `asyncTracking` is also correctly decremented on rejection, so
  `Suspense` no longer gets stuck in the loading state when a promise
  rejects.
- **Errors thrown during reactive updates no longer crash the
  system.** `Computation.update()`, `Memo.update()`, and
  `Derived.update()` now catch errors, clean up partial state, and
  route to the nearest error boundary (or `console.error`). Errors
  thrown from deferred callbacks (`owned`, `root`) are caught by
  `runWithOwner`. Previously any reactive throw would corrupt the
  update queue and crash.
- **Errors thrown inside cleanup functions are now caught.**
  Previously a throwing cleanup would crash `dispose()`, preventing
  remaining cleanups from running and potentially crashing the
  reactive update cycle. Now `doCleanups()` catches each cleanup error
  and routes it to the nearest error boundary. All remaining cleanups
  still run.
- **Rejected promises in `action` chains now route to error
  boundaries.** `resolve()` (used by `action`) previously only passed
  `onFulfilled` to `.then()`. A rejected promise inside an action
  chain was unhandled. Now a rejection handler re-throws via `owned`,
  routing through `runWithOwner` → `routeError` to the nearest
  `catchError` / `Errored` boundary.

# pota v0.20.216

- removed `cleanupCancel`, it can be used as `owner.cleanupCancel`.
  The problem is that the owner could change and it wont find the
  cleanup callback to remove, so being explicit about its owner is
  better.

# pota v0.20.214

- `writable` has been renamed to `derived`
- removed `save` option from signal

# pota v0.19.211

- When an element has duplicated attributes only the last one is used
  `<div class="1" class="2"/>` yields `<div class="2"/>`
- `writable` and `bind` will also unwrap promises and functions
  recursively.

# pota v0.19.207

- when using `@static`, value do calls `getValue` so that way
  everything just works. This pretty much undo change from last
  version. I aim to make things consistent and this was an
  inconsistent change.
- spreads work the same as native JavaScript now! This is a breaking
  change because multiple spreads or a mix of attributes and spreads
  used to be applied separately. Now it creates a big object with
  every attribute and spread expressions, and spreads adds, aligning
  with how JavaScript works.

# pota v0.19.206

- when using `@static`, value no longer calls `getValue`, if its a
  function you will need to call it

# pota v0.19.203

- remove `propsSplit` utility as its not needed
- remove `proxy` utility, not needed

# pota v0.19.201

- use:ref no longer runs when node is already mounted, it runs before
  its mounted
- transform: inline props when possible

# pota v0.18.184

- renamed `onMount` to `use:connected` as
  `<div use:connected={node=>{}}/>`
- renamed `onUnmount` to `use:disconnected` as
  `<div use:disconnected={node=>{}}/>`
- renamed `ref` to `use:ref`
- renamed `css` to `use:css`
- renamed `pota/web` to `pota/components`
- renamed `pota/html` to `pota/xml`
- renamed `html` to `xml` because prettier breaks the case of
  components names and props
- renamed `onLoaded` in async functions to `onLoad`
- defaults to attributes instead of properties
- - use `prop:innerHTML` instead of `innerHTML`
- - use `prop:textContent` instead of `textContent`
- - use `prop:srcObject` instead of `srcObject`
- - use `prop:indeterminate` instead of `indeterminate` for
    `<input type="checkbox"/>`
- - use `<textarea>{value}</textarea>` instead of
    `<textarea value="${value}"/>` (textareas don't have an attribute
    named value)
- renamed `Router` to `Route`
- renamed `location.query` to `location.searchParams`
- moved `useLocation.Navigate` to `pota/components`
- renamed `pota/plugin` to `pota/use`
- renamed `pota/plugin/use$Name.js` to `pota/use/$name.js`
- it no longer exports 'pota/std'
