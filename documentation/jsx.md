# JSX

Maintainer notes on pota's JSX namespace, attributes, events,
callbacks, and the `Properties<T>` mapped type. For the broader
type system (global types, component utilities, generated types),
see `documentation/typescript.md`.

## JSX Namespace (jsx/namespace.d.ts)

The `JSX` namespace is **global** — no import needed anywhere.

### Key types

- **`JSX.Element`** — what components return. Wide union: string,
  number, boolean, object, DOM Element, functions, promises, arrays.
- **`JSX.ElementType`** — what can be a component: tag name,
  function, class, or stringifiable object.
- **`JSX.ElementClass`** — class component shape: `render(props)`,
  optional `ready()` and `cleanup()`.
- **`JSX.Props<T>`** — `T & { children?: JSX.Element }`.
- **`JSX.IntrinsicElements`** — maps tag names to attribute types.
- **`JSX.Elements`** — alias for `IntrinsicElements`.

### Attribute layers

For any native element `<div>`, the full attribute type is built
from layers:

1. **ElementAttributes\<E\>** — base for all elements:
   PotaAttributes + CSSAttributes + AriaAttributes + EventHandlers
2. **HTMLAttributes\<E\>** — HTML-specific attributes (id, title,
   tabindex, data-*, etc.)
3. **Per-element interface** (e.g. `HTMLAnchorAttributes`) — element
   specific attributes (href, target, etc.)
4. **`& Properties<E>`** — intersected at each element definition,
   adds `prop:*` accessors for writable DOM properties unique to
   the concrete element (base class props are filtered out)

### Pota-specific attribute namespaces

| Prefix | Purpose | Example |
| --- | --- | --- |
| `on:` | Event listeners | `on:click={handler}` |
| `use:` | Directives/lifecycles | `use:ref={callback}` |
| `class:` | Dynamic classes | `class:active={isActive}` |
| `style:` | Individual CSS props | `style:color={color}` |
| `prop:` | DOM properties | `prop:innerHTML={html}` |
| `attr:` | Force attribute mode | `attr:data-x={value}` |

### Event types

All under `JSX.*`:

- `EventHandler<Event, Element>` — function, `handleEvent` object,
  or object with options.
- `EventHandlers<Event, Element>` — single handler or array
  (recursive).
- `EventEvent<Event, Element>` — event with `currentTarget`.
  Uses `Event & { currentTarget: Element }` intersection to
  narrow `currentTarget` from `EventTarget | null` to the
  concrete element type.
- `EventType` — map of event names to event objects.

### Callback types

All under `JSX.*`:

- `CallbackElement<Element>` — `(node: Element) => void` or array.
  Used for `use:ref`, `use:connected`, `use:disconnected`.
- `CallbackEvent<Event>` — event callback.
- `CallbackEventElement<Event, Element>` — event + element callback.
  Used for `use:clickoutside` etc.

## Component Utility Types (jsx/components.d.ts)

For defining and typing user components. All global, no imports
needed.

### Defining components

```ts
Component<P>           // (props: P) => JSX.Element
ParentComponent<P>     // (props: P & { children?: JSX.Element }) => JSX.Element
VoidComponent<P>       // (props: P) => JSX.Element  (semantic: no children)
ComponentType<P>       // Component<P> | class component with props P
FlowComponent<P, C>    // (props: P & { children?: C }) => JSX.Element
Children<C>            // C | (C | JSX.Element)[]
```

`Children<C>` is for components whose children can be a single
callback or an array of callbacks mixed with elements (e.g. For,
Range).

Usage:

```tsx
const MyCard: ParentComponent<{ title: string }> = (props) => {
    return <div><h2>{props.title}</h2>{props.children}</div>
}

const MyInput: VoidComponent<{ value: string }> = (props) => {
    return <input value={props.value} />
}
```

### Context

```ts
Context<T>             // return type of context()
```

Describes the overloaded function returned by `context()`:

- `()` — read the current value (returns `T`)
- `(value: T, fn)` — run `fn` with the **full** context value
- `(value: Partial<T>, fn)` — run `fn` with a **partial** override
- `.Provider` — component with three overloads:
  - `<Ctx.Provider value={fullT}>` matches strictly
  - `<Ctx.Provider value={partialT}>` falls through to the
    `Partial<T>` overload
  - `<Ctx.Provider value={{ [K]: Accessor<T[K]> }}>` — a reactive
    override where each key is an `Accessor<T[K]>` (plain value or
    signal / derived)
- `.walk(callback, context?): boolean` — walks parent contexts;
  returns `true` when the callback stopped iteration by returning
  `true`

The dual setter / Provider overloads both strictly check full-`T`
values first (catching typos in literal-union fields) while still
permitting the common "override some keys" pattern through the
`Partial<T>` fallback.

### Prop extraction

- `ComponentProps<T>` — extracts the props type from a component
  function or tag name. Works with `(props: P) => any` and
  `keyof JSX.IntrinsicElements`.

## Properties\<T\> (jsx/properties.d.ts)

Auto-generates `prop:*` attributes for writable, element-specific
DOM properties. The file has 3 types:

```
IfEquals<A, B, Y, N>     — structural equality test
IsReadonlyKey<T, K>      — true when K is readonly on T
SkipPropsFrom            — HTMLUnknownElement & HTMLElement & Element & Node
Properties<T>            — the mapped type, intersected at each element
```

### Filter chain

For each `K in keyof T`, Properties maps to `prop:${K}` only if:

1. `K ∉ keyof SkipPropsFrom` — not a base-class property
2. `K` is a string (not symbol)
3. `string extends K` is false — drops generic index signatures
   like `HTMLFormElement[name: string]: any`
4. `K` does not start with `aria` — handled by AriaAttributes
5. `T[K] extends PropValue` — allowed value type
6. `IsReadonlyKey<T, K>` is false — writable

`PropValue` is `string | number | boolean | null | MediaStream |
MediaSource | Blob | File | Element | Date` — primitives plus the
writable DOM object types needed for `<audio>` / `<video>.srcObject`,
the popover / command APIs (`popoverTargetElement`,
`commandForElement` on `<button>` / `<input>`), and `Date` so
`<input type="date">` `prop:valueAsDate` stays writable.

The value type is `Accessor<V>` where `V` is `T[K]` with one
ergonomic widening: **general `string` → `string | number`**. HTML
coerces numeric values into string properties at runtime, so the
type allows it. **String literal unions stay exact** — `prop:loading`
on `<img>` (`"eager" | "lazy"`) still narrows / autocompletes —
because the widening only kicks in when `string extends V`. Other
primitive types (number, boolean, null) stay exact too; a
boolean-typed prop rejects `''`.

### Why IsReadonlyKey is sufficient

Previously the file had 8 types including `UnionToIntersection`,
`IsUnion`, `IsWidePrimitive`, and `IsSingletonLiteral` — the
latter filtered singleton literal properties (e.g. `tagName:
"INPUT"`, `nodeType: 1`). These were redundant because every
singleton-constant property in lib.dom.d.ts is also `readonly`,
so `IsReadonlyKey` catches all of them. Simplified to 3 types.

### Hand-coded prop:\* in jsx/namespace.d.ts

Only three `prop:*` are explicitly declared in the hand-maintained
attribute interfaces — all on base classes filtered by
`SkipPropsFrom`:

| Property | Declared on | Reason |
| --- | --- | --- |
| `prop:innerHTML` | `ElementAttributes` | On Element (SkipPropsFrom) |
| `prop:textContent` | `ElementAttributes` | On Node (SkipPropsFrom) |
| `prop:innerText` | `HTMLAttributes` | On HTMLElement (SkipPropsFrom) |

Everything else (`prop:srcObject`, `prop:checked`, `prop:indeterminate`,
`prop:value`, `prop:href`, `prop:volume`, `prop:colSpan`, etc.)
comes from `Properties<T>` automatically.
