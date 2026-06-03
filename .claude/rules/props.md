---
paths:
  - 'src/core/props/**'
  - 'src/use/dom.js'
---

# Props pipeline

`src/core/props/` turns every JSX attribute (and every key in a spread
object) into DOM state — a small dispatcher over two plugin maps, with
reactive unwrapping handled by `withValue`. The Babel preset and the
JSX runtime both call `assignProp` / `assignProps`, so every prop in
pota lands here. Entry points live in `@main.js`. Verify DOM
behaviour and attribute/property semantics before changing this layer.

## Dispatch

`assignProp(node, name, value)` resolves in order:

1. **Whole-name plugin** — `plugins.get(name)` (`class`, `style`,
   `use:ref`, …). `use:ref` is registered as its own plugin, not via
   the `use:*` namespace.
2. **Namespace plugin** — if `name` contains `:`, split and look up the
   prefix in `pluginsNS`. Registered NS plugin → invoke
   `(node, localName, value)`; otherwise fall through to
   `setAttributeNS` (prefix resolved against the `NS` table in
   `src/constants.js`). Splits are cached per name.
3. **Catch-all** — `setAttribute(node, name, value)`.

`assignPropNS` is the Babel preset's pre-split variant (`ns` /
`localName` already separated at compile time) — same order, minus the
split.

The `namespaces` set is fixed: `on`, `prop`, `class`, `style`, `use`.
`propsPlugin` / `propsPluginNS` are **internal** (not exported from
`pota`); the five namespaces are not extensible. Per-element behaviour
ships as `use:ref` factories from `pota/use/*` (see the
components-and-use rule). The one directly-registered `use:` name is
`use:bind` (`propsPlugin('use:bind', …)` in `src/use/bind.js`) — a
**whole-name** plugin resolved at step 1, never via the `use`
namespace, and it does not call `namespaces.add`.

## Microtask vs synchronous

`propsPlugin(name, fn, onMicrotask = true)` — the **default defers** to
scheduler priority 1 (`onProps`), right when a plugin's effect depends
on other props or siblings being in place. All built-ins register
synchronously (`onMicrotask=false`) **except `use:css`**. So a custom
`use:*` registered with the default needs `await microtask()` in tests
before its effect is observable; the synchronous built-ins apply
immediately.

## Reactive unwrapping

Every setter that takes a reactive value wraps the DOM write in
`withValue`: functions are tracked, promises awaited (writing an
intermediate `undefined` to clear a stale value while pending), arrays
fully resolved before dispatch. `setClass` / `setClassList` use
`withPrevValue` so class-list diffing can remove classes present last
tick but not this one.

**`setEvent` does NOT wrap in `withValue`** — the value *becomes* the
listener, so passing a function registers that function, not a tracked
getter. For a reactive handler, pass an `EventListenerObject` or swap
via a signal.

## Value semantics

- **`setAttribute`** — `false`/`null`/`undefined` → `removeAttribute`;
  `true` → `setAttribute(name, '')`; else `String(value)`.
- **`setProperty`** — `null`/`undefined` → sets the property to
  **`null`, not `undefined`** (undefined corrupts elements like
  `<progress>`); else `node[name] = value`.
- **`setStyle`** — string → `style.cssText`; object → per-key
  `setElementStyle` (falsy/null → `removeProperty`).
- **`setClass`** — string → `setAttribute('class', value)`; else
  `setClassList` (object keys as flags, arrays of names, function
  re-evaluated via `withPrevValue`).
- **`setEvent`** — always `addEvent` with `ownedEvent(handler)`, so
  handlers inherit the owner's cleanup scope (auto-removed on disposal)
  and throws route to the nearest `Errored` / `catchError` boundary.
