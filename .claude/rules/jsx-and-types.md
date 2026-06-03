---
paths:
  - 'src/jsx/**'
  - 'typescript/**'
  - 'tests/typescript/**'
---

# JSX runtime and type surfaces

- `src/jsx/jsx-runtime.js` is the runtime;
  `typescript/jsx/namespace.d.ts` is large and hand-maintained. Prefer
  **small, local** changes; avoid wholesale reformatting or renaming
  that churns thousands of lines.
- Root and subpath types flow from `typescript/exports.d.ts` and
  `package.json` `"exports"`. If you add or rename a public type
  surface, reconcile **exports**, **runtime**, and the **aggregate
  `.d.ts`** together.
- After edits, run `npm run watch:ts` and fix new diagnostics in
  touched areas.
- No `any` to paper over a missing type; no `@ts-ignore` /
  `@ts-expect-error` suppression. When a cast is truly needed, use the
  JSDoc parenthesized form `(/* @type {T} */ (value))`.

## Layout

`typescript/` holds the hand-maintained `.d.ts`: `exports.d.ts` is the
consumer entry; `jsx/` has the namespace, runtime, `Properties<T>`,
and component utility types; `public/` is ambient (no import);
`private/` is imported via `#type/*`. `generated/types/` is tsc output
from `src/` JSDoc — **JSDoc is the primary source** for component
signatures; hand-written `.d.ts` exists only where tsc can't infer.
Keep types simple: the only complex generics are `Properties<T>` and
`ComponentProps<T>`.

## Attribute layers

For a native element the attribute type is built in layers:
`ElementAttributes<E>` (Pota + CSS + Aria + EventHandlers) →
`HTMLAttributes<E>` → per-element interface (named
`HTML<Tag>ElementAttributes`, e.g. `HTMLAnchorElementAttributes`) →
`& Properties<E>` (adds `prop:*` for that element's writable DOM
props). Pota namespaces: `on:` (events), `use:`
(directives/lifecycle), `class:`, `style:`, `prop:`.

## Overload ordering — strictest first, primary last

When a `@type` has multiple call signatures, order matters in **two
opposite directions**:

- **Call-site resolution** (JSX usage, `fn(args)`) tries overloads
  top-to-bottom and picks the first match → put the
  **strictest/most-specific first**.
- **Structural matching** (assignability, inference through a generic
  slot like `Each<T>`) uses the **last** signature as the primary view
  → put the **broadest/preferred-inference last**.

Applied in pota:

- `DerivedSignal<R>` / `SignalFunction<T>` — **setter first, getter
  last**, so structural matching against `() => T` picks up the getter
  and `<For each={derived(...)}>` infers `T` cleanly.
- `Context<T>` — `setter(T)` → `setter(Partial<T>)` → getter last.
- `Context<T>.Provider` — full-`T` (strict) → `Partial<T>` →
  `{ [K in keyof T]?: Accessor<T[K]> }` (reactive per-key override)
  last.
- `Component()` — three-overload intersection: (1) factory form (one
  arg); (2) intrinsic tag — props checked strictly against
  `ComponentProps<T>` so excess props error; (3)
  function/class/element with free `P`, last, to preserve a generic
  component's inner `T` (which would otherwise collapse to `unknown`).
  String tags match (2); generic functions skip to (3).

Prefer a single `@type` intersection of call signatures over multiple
`@overload` blocks (matches `Match`, `For`, `Range`): easier to read,
more compact `.d.ts`. Exception: when the function accumulates
properties after declaration (`useContext.Provider`,
`useContext.walk`), `@overload` on a function declaration is cleaner.

## Phantom intersection on `memo`

`memo()` returns `SignalAccessor<T> & { readonly memo?: void }`. The
phantom property never exists at runtime — it gives TypeScript enough
structural info to infer `T` when `memo()` is used inline in another
generic context (e.g. `<For each={memo(() => [...])}>`); without it,
inference between two generic calls collapses `T` to `unknown`. The
**intersection** (not interface inheritance) is what shifts the
inference path.

## `Properties<T>` (`jsx/properties.d.ts`)

Auto-generates `prop:*` for writable, element-specific DOM properties.
Maps `K in keyof T` → `prop:${K}` only when: `K ∉ SkipPropsFrom`
(Element/Node/HTMLElement/HTMLUnknownElement base props); `K` is a
string; `string extends K` is **false** (drops index signatures like
`HTMLFormElement`'s `[name: string]: any`, which would otherwise
shadow real keys like `noValidate`); not `aria*`;
`T[K] extends PropValue`; and writable (`IsReadonlyKey` false).

`PropValue` =
`string | number | boolean | null | MediaStream | MediaSource | Blob | File | Element | Date`
— primitives plus the writable object types for `srcObject`,
popover/command targets (`popoverTargetElement`, `commandForElement`),
and `valueAsDate`. `null` stays so nullable props
(`crossOrigin: string | null`) can be reset.

Value widening: emits `Accessor<V>` where **general `string` →
`string | number`** (HTML coerces numbers into string props), but
**string-literal unions stay exact** (the widening triggers only when
`string extends V`, e.g. `prop:loading` `"eager"|"lazy"` still
narrows); number/boolean/null stay exact (a boolean prop rejects
`''`).

Only **three** `prop:*` are hand-coded in `namespace.d.ts`, because
they sit on `SkipPropsFrom` base classes: `prop:innerHTML` /
`prop:textContent` (Element/Node) and `prop:innerText` (HTMLElement).
Everything else (`prop:srcObject`, `prop:value`, `prop:checked`, …)
comes from `Properties<T>` automatically — don't hand-add them.

## Event typing — divergences from lib.dom

These are intentional — don't "fix" them to match `lib.dom`:

- Click family is **`PointerEvent`**, not `MouseEvent` (`on:click`,
  `on:auxclick`, `on:contextmenu`) so `e.pointerId`/`pressure`/`type`
  are accessible; `on:dblclick` stays `MouseEvent` per spec. Handlers
  typed `(e: MouseEvent)` still assign in via contravariance.
- `on:pointerrawupdate` → `PointerEvent`; `on:command` →
  `CommandEvent`. Some webkit/XR/scroll-snap events are kept for
  compatibility though absent from modern lib.dom.
- `EventHandlersWindow` covers window/document-level events attachable
  on `<body>`/`<frameset>`/`<svg>` (navigation, visibility, device,
  messaging, clipboard).

## Type-level tests (`tests/typescript/`)

Run via `npm run test:ts-tests` (`tsc -p tests/tsconfig.json`). The
file split mirrors the area each covers: `jsx.tsx` (intrinsics,
attributes, events, `prop:*`/`on:*`/`use:*`, component utility types),
`types.tsx` (structural utilities — `Accessor`, `Each`, `Merge`,
`ComponentProps`, …), plus `components.tsx`, `reactive.tsx`,
`store.tsx`, `utility.tsx`, `use.tsx`. Open the file for exact
coverage.
