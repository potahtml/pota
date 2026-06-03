---
paths:
  - 'src/components/**'
  - 'src/use/**'
---

# Built-in components and `use/*` modules

- Components ship under `pota/components`, composables under
  `pota/use/*`. Match sibling files (naming, prop handling, how
  signals/store touch the renderer); run `npm run build:ts` after
  API-visible changes and test under `tests/api/components/`.
- Adding a `use/*` module: a new `src/use/*.js` is exported
  automatically by the `./use/*` wildcard, and its types come from
  `generated/types/use/` via tsc (see the exports rule). Follow
  existing pairs.

## Ref factories over `use:<name>` directives

The element-attached side of every new `use/*` plugin must be a **ref
factory** consumed via `use:ref`, not a custom `use:<name>`
propsPlugin. `use:ref` is the single registered lifecycle attribute;
`propsPlugin` registrations for new directive names are deprecated.

```js
// ✅ ship a ref factory: opts → (node: Element) => void
export const clickOutside = handler => node => {
	/* … */
}

// at the call site:
;<div use:ref={clickOutside(handler)} />
```

Concretely:

- Don't call `propsPlugin('use:foo', ...)` for new plugins. Existing
  factories (`visible`, `clickOutside`, `scrollIntoView`, `lazyImage`,
  etc.) already follow the pattern — match them.
- Don't add new `'use:<name>'?` slots to
  `typescript/jsx/namespace.d.ts`. The existing `use:*` slots already
  cover the registered directives (`use:ref`, the lifecycle pair, the
  grandfathered `use:bind`, etc.).
- Multiple refs on one element compose via array:
  `use:ref={[clickOutside(h), preventEnter]}`.

### Exception: `bind`

`bind` is the one intentional holdout. It ships as a
`propsPlugin('use:bind', …)` and `bind(initial)` itself returns a
`SignalFunction` — so a single call covers both the cell and the
directive value:

```jsx
const value = bind('hello')   // SignalFunction
<input use:bind={value}/>
```

Don't migrate `bind` to a ref factory and don't introduce new plugins
that copy its dual-purpose shape; this pattern is grandfathered for
`bind` only.

## `Errored` — the error boundary (`src/components/Errored.js`)

A classic error boundary, pota-flavored. The name avoids shadowing the
global `Error`. Props: `children` (the protected subtree) and
`fallback?` — a JSX element/text or `(err, reset) => Children`; omit it
and an errored subtree renders nothing. The `catchError` primitive it
builds on is documented in the core-and-lib rule.

**Catches:** synchronous throws during initial render; reactive throws
in `effect`/`memo`/`derived`; deferred-callback throws (`owned`,
promise `.then`); **event-handler throws** (via `ownedEvent`); rejected
promises (inside `derived`, `action`, or a bare promise child); throws
inside cleanup functions during disposal (remaining cleanups still
run).

**Does not catch:** siblings *outside* its subtree. Nesting: an inner
boundary catches first; an inner boundary with no fallback renders
nothing and does **not** re-throw to the outer one. Sibling boundaries
are independent. `reset()` clears the error and re-runs `children`; if
the cause is still broken it is re-caught. A mid-render throw replaces
the *whole* subtree with the fallback (matches React/Solid) — no
partial-children semantics, and no logging hooks by design.

The implementation shape is deliberate — preserve these when editing:

- **Two memos.** The inner `children` memo materializes the subtree
  under `catchError` and owns its effects; the outer memo tracks `err`
  and swaps children/fallback. The split keeps writing `err` from
  inside the inner memo from re-triggering itself.
- **`attempt` signal** gives `reset` a clean re-run trigger (fresh
  `dispose()` of the last attempt's owned computations).
- **`batch` in `reset`.** Event-handler context runs
  `runUpdates(fn, true)`, which doesn't set a shared `Updates`, so two
  signal writes would re-evaluate the outer memo twice (once with stale
  children). `batch` makes the transition atomic.
- **`noError` is a module `Symbol()`**, not `undefined` — so
  `throw undefined` is still detected (a `!==` compare against the
  sentinel) instead of silently swallowed.

Tests: `tests/api/components/errored.jsx`,
`tests/api/reactivity/catch-error.jsx`,
`tests/api/reactivity/cleanup.jsx`.
