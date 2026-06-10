---
name: pota
description:
  Write idiomatic pota code — components, reactive apps, JSX, stores,
  use/* plugins. Use when writing or reviewing pota components, fixing
  pota bugs, adding features to a pota app, or creating examples.
  Covers signals, JSX conventions, built-in components, store layer,
  and use/* modules.
---

# Writing idiomatic pota

Use these conventions when writing pota JSX, components, reactivity,
or use/\* plugins. The library semantics section of AGENTS.md is the
canonical reference; this skill distills the day-to-day patterns.

**If it's a function, it's reactive. If it's not, it's not.**

## JSX conventions

- **Events:** native elements use `on:click={handler}`, components use
  `onClick={handler}`.
- **Classes:** always `class=`, never `className=`.
- **Element ref:** `use:ref={node => …}` or a ref factory; bare `ref=`
  does NOT capture the node.
- **Reactive children:** pass the **reader function**: `{count.read}`
  or `{() => expression}`. `{count}` passes the signal object itself
  (not a valid child). `{count.read()}` reads once (snapshot, not
  reactive).
- **Reactive props:** same rule — `<Show when={flag.read}>`, not
  `{flag}` or `{flag.read()}`.
- **Inline styles:** keys are **kebab-case**:
  `style={{ 'flex-direction': 'column' }}`. camelCase keys are
  silently dropped.
- **Imports:** relative imports include the file extension
  (`./foo.js`).

## Signal API

```js
import { signal } from 'pota'

const count = signal(0) // create with initial value
count.read() // read current value (tracks in effects/memos)
count.write(5) // set value (does NOT receive previous)
count.update(prev => prev + 1) // set based on previous
```

```js
import { memo, derived, resolve } from 'pota'

const doubled = memo(() => count.read() * 2) // cached, lazy
const tripled = derived(() => count.read() * 3) // writable memo; chains unwrap fns/promises
const kids = resolve(() => props.children) // resolve children once, read many times
```

```js
import {
	effect,
	batch,
	untrack,
	on,
	cleanup,
	context,
	ref,
} from 'pota'

effect(() => {
	/* re-runs when the signals it reads change */
})
batch(() => {
	/* groups writes, effects fire once after */
})
untrack(() => {
	/* reads without subscribing */
})
on(count.read, () => {
	/* explicit deps; callback runs untracked, no args */
})
cleanup(() => {
	/* scope teardown */
})

const Ctx = context(defaultValue) // → Ctx() / <Ctx.Provider value={…}>
const el = ref() // → use:ref={el}, then effect(() => el())
```

Prefer derivation (`memo` / `derived` / `resolve`) over manual
synchronization — effects are a last resort, not the default tool.

## Built-in components (from `pota/components`)

```js
import {
	Show,
	For,
	Match,
	Switch,
	Dynamic,
	Suspense,
	Errored,
	Range,
	Portal,
	Head,
	A,
	Route,
	Navigate,
	Collapse,
	Splitter,
	Tabs,
	Normalize,
} from 'pota/components'
```

- **`<Show when={condition} fallback={…}>`** — conditional rendering.
  `when` is truthy/falsy. Children can be a callback receiving the
  value: `{v => <p>{v}</p>}`.
- **`<For each={array} fallback={…}>`** — keyed list reconciliation.
  Children receive `(item, index)`. Accepts any iterable;
  `reactiveIndex` makes the index a function `() => number`.
- **`<Match when={value}>`** / **`<Switch>`** — pattern matching.
- **`<Dynamic component={Component} />`** — render a dynamic
  component.
- **`<Suspense>`** — async boundary for promises.
- **`<Errored fallback={…}>`** — error boundary; `fallback` may be
  `(err, reset) => …`.
- **`<Range start={0} stop={10} step={1}>`** — iterate a numeric
  range.
- **`<A href="…">`** — client-side navigation link.
- **`<Route path="…" component={…}>`** — route definition.

## Props

| Prop                  | Description                        |
| --------------------- | ---------------------------------- |
| `use:ref`             | Element ref (before DOM insert)    |
| `use:connected`       | After DOM insert (safe for focus)  |
| `use:css`             | Scoped CSS (`class` → unique name) |
| `on:*`                | Events                             |
| `prop:*`              | DOM properties                     |
| `style:*` / `class:*` | Individual style/class props       |

## Store (from `pota/store`)

```js
import { mutable, signalify } from 'pota/store'

// deep reactive proxy — tracks every level
const state = mutable({ count: 0, user: { name: 'q' } })
state.count++ // reactive mutation
state.user.name = 'quack' // also reactive

// in place, first level only — own properties become signal-backed
const settings = signalify({ theme: 'dark' })
settings.theme = 'light' // reactive write
// signalify(target, ['keys']) limits it to specific keys
// (keys may not exist yet); it is NOT recursive
```

Also exported: `merge` / `replace` / `reset` reconcilers, `copy`,
`readonly`, `project`.

## Use/_ modules (from `pota/use/_`)

Each is a ref factory consumed via `use:ref`:

```js
import { clickOutside } from 'pota/use/clickoutside'
import { shortcut } from 'pota/use/keyboard'
<div use:ref={clickOutside(() => console.log('clicked outside'))} />
<div use:ref={shortcut('Escape', onClose)} />
```

Compose multiple refs with an array:

```jsx
<div use:ref={[clickOutside(handler), preventEnter]} />
```

Two-way binding:

```jsx
import { bind } from 'pota/use/bind'
const name = bind('hello')
<input use:bind={name} />
```

## Setup and entry point

JSX compiles via `pota/babel-preset`
(`{ "babel": { "presets": [["pota/babel-preset"]] } }`) or any
react-jsx-style transform with `jsxImportSource: "pota"`. Without a
build step, the `xml` tagged template from `pota/xml` parses
well-formed XML markup at runtime. Starter templates:
https://github.com/potahtml/templates

```jsx
import { render, signal } from 'pota'

function Counter() {
	const count = signal(0)
	return (
		<div>
			<p>Count: {count.read}</p>
			<button on:click={() => count.update(n => n + 1)}>+</button>
		</div>
	)
}

render(Counter) // target defaults to document.body
```

## TypeScript

- tsconfig: `"jsx": "react-jsx"`, `"jsxImportSource": "pota"`. The
  component utility types (`Component<P>`, `ParentComponent<P>`,
  `FlowComponent<P, C>`, `ComponentProps<T>`, `Accessor<T>`, …) are
  ambient — available without imports.
- Custom elements: augment the **global** `JSX` namespace — not
  `declare module 'pota'` (that augmentation does not take):

```tsx
declare global {
	namespace JSX {
		interface IntrinsicElements {
			'my-element': JSX.HTMLAttributes<HTMLElement> & {
				'some-attr'?: string
			}
		}
	}
}
```

## Ground truth

The installed package carries its own source: `node_modules/pota/src`
is what actually runs — read it when a signature or behavior is in
doubt. `documentation/content/` has one page per export (rendered at
https://pota.quack.uy/) and `documentation/cheatsheet.md` shows the
whole public surface at a glance.
