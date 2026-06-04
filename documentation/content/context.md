---
title: context
subpath: pota
topic: Reactive core
desc:
  Carries a value through the reactive scope so nested components read
  it without prop drilling.
---

# context

Context carries values through the reactive scope so deeply nested
components can read them without _prop drilling_. A single function
acts as both the provider and the reader.

`context(defaultValue?)` returns a `useContext` function. Call it with
no argument to read the current value (or the default if nothing was
provided). Call it with a value and a `fn` to push that value for the
duration of `fn` — children rendered inside read the new value;
everything outside keeps the previous one. The new value **replaces**
the inherited one entirely; to inherit-and-override, build the merged
object yourself before providing it.

A `Provider` JSX component is attached for use in the tree, plus a
`walk` helper that climbs the `parent` chain of a context value.

## Arguments

| name           | type | description                                                     |
| -------------- | ---- | --------------------------------------------------------------- |
| `defaultValue` | `T`  | value returned by reads when no provider is in scope. Optional. |

**Returns:** `useContext(newValue?, fn?)` — a function that reads when
called bare and provides for the duration of `fn` when called with
`(newValue, fn)`, returning `fn`'s result. It carries:

- `useContext.Provider` — a JSX component; `<Ctx.Provider value={…}>`
  pushes `value` to its children.
- `useContext.walk(callback, context?)` — walks the `parent` property
  of the context value, calling `callback` at each level; return
  `true` from `callback` to stop.

## API shape

```js
// create (defaultValue is optional)
const useCtx = context('default value')

// read
useCtx()

// provide, scoped to fn
useCtx('new value', fn)
```

## Examples

### Theme provider

`context(defaultValue)` returns a `useContext` function with a
`Provider` JSX component attached. Wrap a subtree in
`<Theme.Provider value={…}/>` and any descendant call to `Theme()`
returns that value; with no provider, `Theme()` returns the default.
Providers nest — inner ones override outer ones for their subtree.

```jsx
import { context, render } from 'pota'

const Theme = context('light')

function Label() {
	return <p>theme is {Theme()}</p>
}

function App() {
	return (
		<div>
			<Label />
			<Theme.Provider value="dark">
				<Label />
				<Theme.Provider value="contrast">
					<Label />
				</Theme.Provider>
			</Theme.Provider>
		</div>
	)
}

render(App)
```

### Functional override

Calling the context function as `Theme(newValue, fn)` runs `fn` with
the override applied and returns its result; outside `fn`, the
previous value is restored. Useful when you need the context override
outside the JSX tree — computing a derived value, inside an
[effect](/effect), and so on.

```jsx
import { context } from 'pota'

const Theme = context('light')

console.log(Theme()) // 'light'

const result = Theme('dark', () => {
	return Theme('contrast', () => Theme())
})

console.log(result) // 'contrast'
console.log(Theme()) // 'light' — restored
```

### Reactive context value

Putting a [signal](/signal) _into_ the context value gives descendants
both a reactive read and a write channel. The provider owns the signal
once; any nested component swaps the theme by calling the context's
`set` channel. Note the reader is passed as `theme.read` (the reader
function) so the read stays reactive.

```jsx
import { context, render, signal } from 'pota'

const Theme = context({
	value: () => 'light',
	set: () => {},
})

function Toolbar() {
	const t = Theme()
	return (
		<div>
			<p>current: {t.value}</p>
			<button on:click={() => t.set('light')}>light</button>
			<button on:click={() => t.set('dark')}>dark</button>
		</div>
	)
}

function App() {
	const theme = signal('light')
	return (
		<Theme.Provider
			value={{
				value: theme.read,
				set: v => theme.write(v),
			}}
		>
			<Toolbar />
		</Theme.Provider>
	)
}

render(App)
```
