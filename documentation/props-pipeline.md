# Props pipeline — design and implementation

`src/core/props/` turns every JSX attribute (and every key in a spread
object) into DOM state. It is a small dispatcher on top of two plugin
maps, with reactive unwrapping handled by `withValue`.

Related files:

- `src/core/props/@main.js` — `assignProps`, `assignProp`,
  `assignPropNS` (the dispatcher + entry points)
- `src/core/props/plugin.js` — `propsPlugin`, `propsPluginNS`,
  registered `namespaces` set
- `src/core/props/attribute.js` — the catch-all attribute setter
- `src/core/props/property.js` — `prop:*` namespace
- `src/core/props/event.js` — `on:*` namespace (via `addEvent` +
  `ownedEvent`)
- `src/core/props/class.js` — `class=`, `class:*`, `setClassList`
- `src/core/props/style.js` — `style=`, `style:*`
- `src/core/props/lifecycle.js` — `use:ref`, `use:connected`,
  `use:disconnected`
- `src/core/props/css.js` — `use:css` (scoped stylesheet)

The Babel preset and the JSX runtime both call `assignProp` /
`assignProps` — every prop path in pota ultimately lands here.

---

## Plugin maps

Two maps, registered at module init:

- **`plugins`** — keyed by full prop name (`class`, `style`,
  `use:ref`, etc.). Handles "plugin-as-attribute" — `use:ref={fn}` is
  registered as its own plugin, not via the `use:*` namespace.
- **`pluginsNS`** — keyed by namespace prefix (`prop`, `on`, `class`,
  `style`, `use`). Handles any `ns:name` attribute where `ns` is in
  the `namespaces` set.

The `namespaces` set starts with `on`, `prop`, `class`, `style`, `use`
and grows when user code calls `propsPluginNS`. Every addition also
rewrites `namespaces.xmlns` (a cached `xmlns:ns="/" ...` string
consumed by the `xml` tagged template so colon-prefixed attributes are
legal XML).

### Registration

```js
propsPlugin(name, fn, (onMicrotask = true));
propsPluginNS(nsName, fn, (onMicrotask = true));
```

`onMicrotask=true` is the **default** — the handler runs via
`onProps(() => fn(...args))`, deferring to scheduler priority 1 (see
`documentation/scheduler.md`). That's the right choice for plugins
whose effect depends on other props or sibling children being in place
first.

`onMicrotask=false` — the handler runs synchronously during
`assignProp`. Used by `use:ref`, `use:connected`, `use:disconnected`,
`style`, `class`, `on:*`, `prop:*` — each of these has its own reason
to be immediate (see below).

### Built-in registrations (`@main.js`)

All built-ins register with `onMicrotask=false` (apply synchronously)
**except `use:css`**, which uses the default microtask deferral so a
scoped stylesheet can wait.

| Attribute          | Map       | Handler           | Reason                                        |
| ------------------ | --------- | ----------------- | --------------------------------------------- |
| `prop:*`           | pluginsNS | `setPropertyNS`   | DOM properties written immediately            |
| `on:*`             | pluginsNS | `setEventNS`      | event listeners attached immediately          |
| `use:css`          | plugins   | `setCSS`          | scoped stylesheet can wait                    |
| `use:connected`    | plugins   | `setConnected`    | schedules via `onMount` itself                |
| `use:disconnected` | plugins   | `setDisconnected` | registers a cleanup — no deferral needed      |
| `use:ref`          | plugins   | `setRef`          | ref must resolve before mount                 |
| `style`            | plugins   | `setStyle`        | inline style applied immediately              |
| `style:*`          | pluginsNS | `setStyleNS`      | individual style property applied immediately |
| `class`            | plugins   | `setClass`        | class applied immediately                     |
| `class:*`          | pluginsNS | `setClassNS`      | individual class applied immediately          |

Anything not matched by either map falls through to
`setAttribute(node, name, value)`.

---

## Dispatch

`assignProps(node, props)` is a `for..in` loop over the props object
that calls `assignProp` per key.

`assignProp(node, name, value)` resolves in this order:

1. **Whole-name plugin** — `plugins.get(name)` (e.g. `class`,
   `use:ref`). If found, invoke and return.
2. **Namespace plugin** — if the name contains a `:`, split on it and
   look up the prefix in `pluginsNS`. Split results are cached on a
   per-name `propNS[name]` record so repeated props don't re-split.
   - If the prefix has a registered NS plugin, invoke with
     `(node, localName, value)`.
   - Otherwise fall through to namespaced attributes
     (`setAttributeNS(node, name, value, prefix)`) — the prefix is
     resolved against the `NS` table in `src/constants.js` (xlink,
     xmlns, xml, etc.).
3. **Catch-all** — `setAttribute(node, name, value)` handles
   everything else: string/number/boolean attributes, with
   `false`/`null`/`undefined` removing the attribute, `true` setting
   it to the empty string.

`assignPropNS(node, name, value, localName, ns)` is the variant used
by the Babel preset's pre-split partial output (`ns` and `localName`
are already separated by compile time). Same lookup order, minus the
split step.

---

## Reactive unwrapping

Every setter that accepts a reactive value wraps the actual DOM write
in `withValue(value, fn)` from the reactive core (`src/lib/solid.js`).
This gives:

- **Functions** are tracked — they re-run on dependency changes.
- **Promises** are awaited, with an intermediate default `undefined`
  to remove a stale previous value while pending.
- **Arrays** wait for every element, then dispatch with the
  fully-resolved array.

`setAttribute`, `setProperty`, `setStyle`, and `setElementStyle` all
use `withValue`. `setClass`/`setClassList` use `withPrevValue` so
class-list diffing can remove classes that were present on the
previous tick but not this one.

`setEvent` does **not** wrap in `withValue` — the handler value
becomes an event listener, which means passing a function registers
_that function_, not a tracked getter. Pass an `EventListenerObject`
or attach/detach handlers via a signal if you need reactivity on the
handler itself.

---

## Value semantics (quick reference)

`setAttribute`:

- `false` / `null` / `undefined` → `removeAttribute`
- `true` → `setAttribute(name, '')`
- anything else → `setAttribute(name, String(value))`

`setProperty`:

- `null` / `undefined` → sets the property to `null` (not `undefined`,
  which would corrupt elements like `<progress>`)
- otherwise → `node[name] = value`

`setStyle` (string) → `style.cssText = value` `setStyle` (object) →
iterate keys, delegate to `setElementStyle` `setElementStyle`
falsy/null → `removeProperty`; else `setProperty`

`setClass` (string) → `node.setAttribute('class', value)` `setClass`
(other) → delegates to `setClassList` (object keys as flags, arrays of
class names, function → re-eval with `withPrevValue`)

`setEvent` — always goes through `addEvent` with
`ownedEvent(handler)`, so handlers inherit the current owner's cleanup
scope (handlers are automatically removed on disposal, and throws
route to the nearest `Errored` / `catchError` boundary).

---

## Extension points for user plugins

```js
import { propsPlugin, propsPluginNS } from "pota";

propsPlugin("use:focus", (node, value) => {
  if (value) node.focus();
});

propsPluginNS("data", (node, localName, value) => {
  // runs for every data:* attribute
  node.dataset[localName] = value;
});
```

Both register on the microtask tick by default. Pass `false` as the
third argument if the handler must run synchronously.

New NS names automatically become part of the `xml` template namespace
list — the `xml` factory re-reads `namespaces.xmlns` per template, so
adding a plugin before calling `xml` makes the prefix legal in XML
markup.
