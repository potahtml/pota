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
  (`./foo.js`), tabs, single quotes, no semicolons.

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
const tripled = derived(() => count.read() * 3) // writable memo chain
const resolved = resolve(() => count.read() * 4) // unwraps functions/promises
```

```js
import { effect, batch, untrack, on, cleanup, context, ref } from 'pota'

effect(() => { /* runs on dep change, returns dispose */ })
batch(() => { /* groups writes, effects fire once after */ })
untrack(() => { /* reads without subscribing */ })
on(signal, (val, prev) => { /* explicit deps */ })
cleanup(() => { /* scope teardown */ })

const Ctx = context(default) // → Ctx() / <Ctx.Provider value={…}>
const el = ref() // → use:ref={el}
```

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
  Children receive `(item, index)`. `reactiveIndex` makes index a
  signal. Accepts arrays, Sets, Maps.
- **`<Match when={value}>`** / **`<Switch>`** — pattern matching.
- **`<Dynamic component={Component} />`** — render a dynamic
  component.
- **`<Suspense>`** — async boundary for promises.
- **`<Errored fallback={…}>`** — error boundary.
- **`<Range from={0} to={10}>`** — iterate a numeric range.
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
import { signalify, mutable } from 'pota/store'

const state = mutable({ count: 0, items: [] })
state.count++ // reactive mutation

const sig = signalify(state, 'count') // signal from a store path
```

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

## App entry point

```jsx
/** @jsxImportSource pota */
import { render, signal } from 'pota'
import { Show } from 'pota/components'

function Counter() {
	const count = signal(0)
	return (
		<div>
			<p>Count: {count.read}</p>
			<button on:click={() => count.write(count.read() + 1)}>
				+
			</button>
		</div>
	)
}

render(() => <Counter />, document.body)
```
