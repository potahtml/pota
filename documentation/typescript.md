# Type System

Maintainer notes on how pota's types are structured and how
components are typed. For the directory layout and how to add
new types, see `typescript/readme.md`.

## File Layout

```
typescript/
  exports.d.ts              consumer entry (package.json "types")
  jsx/
    namespace.d.ts          JSX namespace (~4k lines)
    runtime.d.ts            jsxImportSource entry
    properties.d.ts         Properties<T> — auto-generates prop:*
    components.d.ts         Component, FlowComponent, ComponentProps, etc.
  public/                   ambient types, globally available
    pota.d.ts               Accessor, Signal*, When, Each, Merge
    components.d.ts         Dynamic<T, P>
  private/                  module types, imported via #type/*
    action.d.ts             action() overloads
    derived.d.ts            derived() overloads
    Route.d.ts              Route context type
  generated/types/          tsc output from src/ JSDoc
```

### Wiring in package.json

```json
".": {
    "types": "./typescript/exports.d.ts",
    "default": "./src/exports.js"
},
"./jsx-runtime": {
    "types": "./typescript/jsx/runtime.d.ts",
    "default": "./src/jsx/jsx-runtime.js"
}
```

## Global Types (public/pota.d.ts)

These are ambient — available everywhere without imports.

### Core reactive types

- `Accessor<T>` — `(() => Accessor<T>) | SignalAccessor<T> | T`.
  A value that might be reactive. Used heavily in component props
  (e.g. `When<T> = Accessor<T>`).
- `SignalAccessor<T>` — `() => T`. A read-only signal.
- `SignalSetter<T>` — `(newValue?: T) => SignalChanged`.
- `SignalUpdate<T>` — `(fn: (prev: T) => T) => SignalChanged`.
- `SignalTuple<T>` — `[SignalAccessor, SignalSetter, SignalUpdate]`.
- `SignalObject<T>` — SignalTuple + named `.read`, `.write`,
  `.update`.
- `Accessed<T>` — recursively unwraps accessors to get the inner
  value type.

### Options types

- `SignalOptions<T>` — `{ equals?: false | ((a, b) => boolean) }`.
  Used by `signal()` and `memo()`. `equals: false` disables the
  change check entirely.
- `EffectOptions` — `undefined | Record<string, never>`. Used by
  `effect()`, `syncEffect()`, `on()`, and `root()`. Empty shape
  that rejects arbitrary keys — prevents accidental overrides of
  internal `Computation` fields (`state`, `fn`, `updatedAt`). A
  named anchor for future options.

### Semantic prop types

- `When<T>` = `Accessor<T>`. Used for conditional props
  (`Show.when`, `Match.when`, `Route.when`).
- `Each<T>` = `Accessor<Iterable<T>>`. Used for list iteration
  (`For.each`).

## Dynamic\<T, P\> (public/components.d.ts)

Props type for the `Dynamic` component. Maps each prop through
`Accessor<P[K]>` so any prop accepts both plain values and reactive
accessors (signals, derived, plain functions). Pota's renderer
unwraps reactive values before passing them to the underlying
component. Default `P = ComponentProps<T>` forces TypeScript to
resolve conditional types, enabling excess property checking for
both string tags and function components.

## Generated Component Types

Component types in `generated/types/components/` come from tsc
processing JSDoc in `src/components/*.js`. These are the types
that `pota/components` currently resolves to.

Most built-in components use the utility types from
`jsx/components.d.ts` in their JSDoc:

| Component | Utility type | Style |
| --- | --- | --- |
| `Head` | `FlowComponent` | `@type` on const arrow |
| `Normalize` | `FlowComponent` | `@type` on const arrow |
| `Suspense` | `FlowComponent<{ fallback }>` | `@type` on const arrow |
| `Collapse` | `FlowComponent<{ when, fallback }>` | `@type` on const arrow |
| `Switch` | `FlowComponent<{ fallback }>` | `@type` on const arrow |
| `Errored` | `FlowComponent<{ fallback }>` | `@type` on const arrow |
| `Portal` | `ParentComponent<{ mount }>` | `@type` on const arrow |
| `Navigate` | `ParentComponent<{ path, ... }>` | `@type` on const arrow |
| `A` | `Component<{ href, ... } & Elements['a']>` | `@type` on const arrow |
| `Range` | `FlowComponent<..., Children<...>>` | `@type` on const arrow |
| `For` | generic with `Children<...>` | `@type` on const arrow |
| `Dynamic` | generic with `Dynamic<T>` | `@template` on function |
| `Show` | overloads with `Children<...>` | `@type` on const arrow |
| `Match` | overloads with `Children<...>` | `@type` on const |
| `Fragment` | `ParentComponent` | `@type` on const arrow |
| `Route.Default` | `ParentComponent` | `@type` on const arrow |

Components that don't use utility types (with reasons):

- **`Route`** — has `.Default` property assignment, which
  prevents `@type` on const. Uses `@typedef RouteProps`.
- **`Tabs`** — has `.Labels`, `.Label`, `.Panels`, `.Panel`
  property assignments (same constraint as Route).
- **`Labels`**, **`Label`**, **`Panels`**, **`Panel`** — use
  `Merge<>` with native element attribute types. They're
  passthroughs, not standard components.

## Design Principles

1. **Ambient types, no duplication.** The JSX namespace and
   reactive types are global. Source JSDoc uses `JSX.Element`,
   `DOMElement`, etc. directly — no alias layer.

2. **JSDoc is the primary source for component signatures.** The
   JSDoc in `src/components/*.js` drives both in-editor hover and
   generated types. Hand-maintained `.d.ts` only exists where tsc
   can't infer correctly.

3. **Keep it simple.** No `UnionToIntersection` or deep conditional
   types in component types. The only complex generics are in
   `jsx/properties.d.ts` (`Properties<T>` — 3 helper types for
   DOM property filtering) and `ComponentProps<T>` (prop
   extraction).

4. **Accessor everywhere.** Props that can be reactive use
   `Accessor<T>`, which accepts both plain values and signals.
   The renderer handles unwrapping.

## Verification Checklist

Validated in `pota.docs/src/pages/tests/typescript/typescript.tsx`
and `tests/typescript/*.tsx` (runs with `tsc -p tests/tsconfig.json --noEmit`):

Test files under `tests/typescript/`:

| File | Scope |
| --- | --- |
| `jsx.tsx` | Intrinsic elements, attributes, events, `prop:*`, `on:*`, `use:*`, Properties<T>, component utility types (Component, ParentComponent, VoidComponent, FlowComponent, ComponentType, Children, Context, Dynamic) |
| `components.tsx` | Built-in components, user component patterns, Dynamic, HOC, generic user components |
| `reactive.tsx` | signal/memo/derived and all reactive primitives (effect, on, batch, untrack, cleanup, owned, action, withValue, etc.), context patterns |
| `store.tsx` | signalify, mutable, merge/replace/reset, copy, readonly, project, firewall, updateBlacklist |
| `utility.tsx` | Component() runtime, render/insert/toHTML, getValue, setAttribute/setProperty/setStyle/setClass/setClassList, propsPlugin, ready/readyAsync, xml |
| `use.tsx` | Smoke tests for `pota/use/*` subpath exports |
| `types.tsx` | Pure type assertions: Accessor/When/Each/Accessed, Merge, ComponentProps, Signal primitive types, JSX.Element/ElementType/ElementClass/DOMElement/Props/Elements/BooleanAttribute/StyleAttribute/EventType/EventHandler/IntrinsicElements |

- [x] `<Show when={signal}>` — T infers from the signal;
  `{(value) => ...}` gets `SignalAccessor<T>`
- [x] `<Show when={signal}><div/></Show>` — plain JSX children
  accepted without type error
- [x] `<Match when={signal}>{(value) => ...}</Match>` — same
  inference as Show
- [x] `<For each={items}>{(item) => ...}</For>` — item type
  infers from array element type
- [x] `<For each={items}>{(item) => ...}{(item) => ...}<p/></For>`
  — array children (callbacks + elements) accepted
- [x] `<Range stop={5}>{(n) => ...}</Range>` — n infers as
  number
- [x] `<Dynamic component={MyComp} .../>` — props infer from
  the component type; excess properties error for both string
  tags and function components
- [x] `<div on:click={(e) => ...}>` — e infers as MouseEvent
- [x] `use:ref` callback receives the correct element type
- [x] Component utility types (`Component`, `FlowComponent`,
  `Children`, `Context`, etc.) available globally with just
  `jsxImportSource: "pota"` — no import needed
- [x] All exported components from `pota/components` tested
- [x] Negative tests with `@ts-expect-error` for excess
  property checking, missing required props
- [x] SVG element event and ref type inference
- [x] Form, media, table elements
- [x] `prop:*` on 20+ element types (input, select, textarea,
  anchor, form, video, audio, canvas, img, iframe, td/th, ol,
  dialog, details, label, output, button, fieldset, optgroup,
  option, progress, meter, track, data, li)
- [x] `prop:*` with Accessor/signal values
- [x] `prop:*` negative tests: readonly props, base-class
  props, non-primitive props, aria-prefixed, bogus names,
  wrong value types
- [x] Hand-coded `prop:*` (innerHTML, textContent, innerText,
  srcObject, indeterminate, textarea value)
- [ ] `style={{ ... }}` object form — known issue: csstype
  mapped type loses concrete keys inside `Accessor<>` union
- [x] `derived(() => ...)` inline as `when`/`each` source —
  works after Derived overload reorder (setter listed before
  getter)
- [x] `memo(() => ...)` inline as `when`/`each` source —
  works after adding a phantom property to memo's return type

## Known Type Issues

- **`style` object form:** `style={{ color: 'red' }}` errors
  because the mapped `CSSProperties` keys are lost when wrapped
  in `Accessor<... | string>`. Individual `style:*` props work
  correctly.
- **`isResolved(typedDerived)` rejected by constraint:** The
  generic constraint `T extends ReturnType<derived>` collapses to
  `Derived<unknown>`. Setter contravariance then rejects
  `Derived<number>` etc. — a strictly-typed derived doesn't match
  the unknown setter. The simplest fix is to widen the parameter
  type to `Derived<any>[]` instead of constraining a generic.

## Event type coverage

`typescript/jsx/namespace.d.ts` `EventHandlersElement` is aligned
with TypeScript's `GlobalEventHandlersEventMap` and `ElementEventMap`
from `lib.dom.d.ts`. Two places where pota is intentionally more
specific than lib.dom:

- **`on:pointerrawupdate`** — lib.dom types it as plain `Event`,
  but the spec and MDN agree it fires a `PointerEvent`. Pota uses
  `PointerEvent`.
- **`on:command`** — lib.dom types `oncommand` as plain `Event`,
  but `CommandEvent` is defined (with `.command: string` and
  `.source: Element | null`). Pota uses `CommandEvent` for stronger
  typing in the Invoker Commands API.
- Several webkit-prefixed / XR / scroll-snap events
  (`beforecopy`, `beforecut`, `beforepaste`, `beforexrselect`,
  `scrollsnapchange`, `scrollsnapchanging`, `dragexit`) are present
  in pota but not in modern lib.dom. Kept for compatibility.

Click-family events are `PointerEvent`, not `MouseEvent`
(`on:click`, `on:auxclick`, `on:contextmenu`) — matches lib.dom and
makes `e.pointerId`/`e.pressure`/`e.pointerType` accessible inside
the handler. `on:dblclick` stays `MouseEvent` per spec. Handlers
typed `(e: MouseEvent) => void` still assign into these slots via
parameter contravariance.

`EventHandlersWindow` covers window/document-level events
(attachable on `<body>`, `<frameset>`, `<svg>`):
- Navigation / lifecycle: `beforeunload`, `hashchange`, `popstate`,
  `pagehide`/`pageshow`, `pagereveal`/`pageswap`, `unload`, plus
  `DOMContentLoaded` and `readystatechange`.
- Visibility / focus: `visibilitychange`,
  `pointerlockchange`/`pointerlockerror`.
- Device: `devicemotion`, `deviceorientation`,
  `deviceorientationabsolute`, `gamepadconnected`/`gamepaddisconnected`,
  `orientationchange` (deprecated but still fires).
- Messaging / errors: `message`, `messageerror`, `storage`,
  `rejectionhandled`, `unhandledrejection`.
- Clipboard / system: `clipboardchange` (new),
  `afterprint`/`beforeprint`, `languagechange`, `online`/`offline`.

## Properties\<T\> value widening

`Properties<T>` emits `Accessor<V>` for each writable, non-aria,
non-base-class key of `T` whose type is in the `PropValue` union.
`V` is the DOM property type with an ergonomic widening:

- **General `string` → `string | number`** — e.g. `prop:value` on
  `<input>`, `<textarea>`, `<select>`, `<option>`, `<button>`, or
  `prop:alt` on `<img>`. Writing a number into a string-typed DOM
  property works at runtime (HTML coerces), so the type allows it
  for JSX ergonomics.
- **String literal unions stay narrow** — `prop:loading` on
  `<img>` (`"eager" | "lazy"`), `prop:decoding`, `prop:fetchPriority`,
  etc. still get autocomplete + narrowing because the widening only
  triggers when `string extends V` (i.e. `V` is the general `string`
  type, not a finite union). Implemented via `[V] extends [string]
  ? string extends V ? string | number : V : V`.
- Other primitive types (`number`, `boolean`, `null`) stay exact.
  A boolean-typed prop rejects `''` even though the corresponding
  HTML attribute accepts it — properties need real `true`/`false`.

### PropValue union

The filter used to be `string | number | boolean | null`. It's now:

```ts
type PropValue =
	| string | number | boolean | null
	| MediaStream | MediaSource | Blob | File
	| Element
	| Date
```

This auto-generates through `Properties<T>`:

- `prop:srcObject` on `<audio>` / `<video>` (Media API)
- `prop:popoverTargetElement` on `<button>` / `<input>` (Popover API)
- `prop:commandForElement` on `<button>` (Command / Invoker API)
- `prop:valueAsDate` on `<input>` (Date API)

No hand-coded declarations needed for any of these. `null` stays in
the union so nullable DOM props like `crossOrigin: string | null`
pass through — users can write `null` to reset.

### Index-signature guard

Some DOM interfaces (notably `HTMLFormElement`) have a
`[name: string]: any` index signature. Without a guard, the mapped
type would emit an index signature `[K: \`prop:${string}\`]?:
Accessor<string | number>` — which then shadows specific keys like
`noValidate: boolean`. The filter excludes this by rejecting `K`
when `string extends K` (i.e. `K` is the generic `string` type, not
a literal). Only specific known-literal keys make it through.

### Hand-coded `prop:*`

Still required in `namespace.d.ts` because they're on base classes
filtered by `SkipPropsFrom`:

- `prop:innerHTML`, `prop:textContent` — on `Element` / `Node`
- `prop:innerText` — on `HTMLElement`

Everything else (`prop:srcObject`, `prop:indeterminate`,
textarea `prop:value`, etc.) comes from `Properties<T>`
automatically.

## Type-system techniques used here

### Overload ordering: strictest first, primary last

When a type uses `@type` with multiple call signatures, order
matters in **two opposite directions** depending on which
resolution TypeScript is running:

- **Call-site resolution** (JSX tag usage, direct `fn(args)`)
  — TypeScript tries overloads top-to-bottom and picks the first
  that matches. Put the **strictest/most-specific first**.
- **Structural matching** (assignability to another function
  type, inference through a generic position like `Each<T>`)
  — TypeScript uses the **last** call signature as the primary
  view. Put the **broadest/preferred-inference** last.

Applied patterns in pota:

- **`DerivedSignal<R>`** — setter first, getter last. Structural
  matching against `() => T` picks up the getter, so
  `<For each={derived(...)}>` infers `T` cleanly.
- **`SignalFunction<T>`** — same pattern (setter, then getter).
- **`Context<T>`** — setter(T) → setter(Partial<T>) → getter last.
- **`Context<T>.Provider`** — three overloads: full-T first
  (strict call site), `Partial<T>` second (partial override view),
  then `{ [K in keyof T]?: Accessor<T[K]> }` last (broader
  structural view, allows signals / derived / plain accessors per
  key). `<Ctx.Provider value={fullT}>` matches overload 1;
  `<Ctx.Provider value={partial}>` falls through to overload 2;
  reactive overrides hit overload 3.
- **`Component()`** — factory first, intrinsic-tag-strict second,
  free-`P` last (see next bullet).

### Generic-preserving overloads on `Component()`

The runtime `Component(value, props?)` is typed with an `@type`
intersection of three call signatures:

1. **Factory form** (one arg) — returns a factory typed via
   `ComponentProps<T>`.
2. **Intrinsic tag + props** (two args, `T extends keyof
   JSX.IntrinsicElements`) — props are checked strictly against
   `ComponentProps<T>`, so `Component('div', { nonsense: true })`
   errors via excess-property check.
3. **Function/class/element + props** (two args, `T extends
   Function | Element | object | symbol`, `P` is free) — this
   free-`P` overload preserves generic components' (e.g. `For<T>`)
   inner `T`, which would otherwise collapse to `unknown` via
   `ComponentProps<typeof For>`.

The ordering matters: string tags hit overload 2 first for strict
checking; generic functions skip to overload 3 because their `T`
isn't a string literal.

### Phantom intersection on `memo`'s return type

`memo()` returns `SignalAccessor<T> & { readonly memo?: void }`.
The phantom property never exists at runtime — its sole purpose
is to give TypeScript more structural information so it can infer
`T` cleanly when `memo()` is called inline inside another generic
context (e.g. `<For each={memo(() => [...])}>`). Without it,
bidirectional inference between two generic calls collapses `T`
to `unknown`. The **intersection (vs interface inheritance)**
matters — only `&` shifts TypeScript's inference path.

### Accessor-wrapping on `Dynamic<T, P>`

`Dynamic<T, P>` maps each prop through `Accessor<P[K]>`:

```ts
type Dynamic<T, P = ComponentProps<T>> = {
    [K in keyof P]: Accessor<P[K]>
} & { component: T }
```

This lets users pass signals, memos, deriveds, or plain functions
to any prop through `<Dynamic>` — pota's renderer unwraps them
before forwarding to the underlying component.

### `@type` intersection over `@overload` blocks

For multi-signature functions, prefer `@type` on a const arrow
with an intersection of call signatures rather than multiple
`@overload` JSDoc blocks. Reasons:

- Single-block annotation is easier to read.
- Matches existing `Match`, `For`, `Range` style.
- Generated `.d.ts` output is more compact.

The one exception: when the function needs to accumulate properties
after declaration (e.g. `useContext.Provider = ...`, `useContext.walk = ...`),
`@overload` on a function declaration stays easier because the
`.Provider` assignment can't be expressed inside a single `@type`
without the full `Context<T>` shape upfront.

### Late-binding property via `@ts-expect-error`

`context.toHTML` is attached in `renderer.js` at module init rather
than declared in `createReactiveSystem()`. The Provider body uses
a narrow `// @ts-expect-error` to access it — documented in code
so readers understand it's an intentional late-binding bridge
between solid.js and renderer.js, not a bug.
