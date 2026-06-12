---
title: Emitter
subpath: pota/use/emitter
topic: Events
desc:
  Wraps an event/observer source as a shared signal-backed reactive
  value with refcounted setup/teardown.
---

# Emitter

`Emitter` wraps an event/observer source as a shared signal-backed
reactive value with refcounted setup and teardown. It is the small
class behind every `useX` / `onX` pair in pota
([fullscreen](/use/fullscreen), [visibility](/use/visibility),
[orientation](/use/orientation), [resize](/use/resize),
[focus](/use/focus), and the element-keyed observers in
[intersection](/use/intersection) / [mutation](/use/mutation)). It
sets the source up on the first subscriber, and tears it down when the
last subscriber's owner cleans up.

## Arguments

The constructor takes a single options object.

| Option         | Type                                         | Description                                                                                                   |
| -------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `on`           | `(dispatch: (arg: T) => void) => () => void` | Called on the first subscription. Call `dispatch` whenever the source produces a value; return a teardown fn. |
| `initialValue` | `T \| (() => T)` (optional)                  | Value seeded before the source fires. Defaults to `() => undefined`. Pass a function for lazy reads.          |

**Returns:** an `Emitter` instance exposing `use()` and `on(fn)`.

`on` is called the first time someone subscribes; it receives a
`dispatch` function it should call whenever the source produces a new
value. The function returned from `on` is the teardown, called when
the last subscriber unmounts.

`initialValue` is optional. Without it, the first reactive read sees
`undefined` until the source fires. With it, subscribers get a usable
value immediately. Pass a function so the read happens lazily, inside
the emitter's setup (not at module load).

```jsx
import { Emitter } from 'pota/use/emitter'

const e = new Emitter({
	on: dispatch => {
		// first subscriber arrived — set up source
		const handler = arg => dispatch(arg)
		target.addEventListener('something', handler)

		// return a teardown — called when the last subscriber leaves
		return () => target.removeEventListener('something', handler)
	},
	initialValue: () => readSourceSynchronously(),
})
```

## Public API

`use()` returns a signal accessor — read it from inside an `effect` or
directly in JSX (as a function) to track the value. `on(fn)` wraps the
same accessor in an effect and forwards the value to your callback.
Either form counts as one subscriber.

```jsx
const value = e.use() // signal accessor — re-runs effects on change
e.on(value => {}) // side-effect callback — fired on change
```

## Lifecycle (subscriber counting)

`Emitter` counts active subscribers. `on` runs once when the counter
goes from `0 → 1`; the returned teardown runs when it falls back to
`0`. Multiple components can call `use()` / `on()` and share the
underlying source.

Each `use` / `on` call registers a `cleanup` in the current reactive
scope, so disposal happens automatically when the owning component or
root unmounts. Don't manually subscribe outside of a tracked scope.

## Document-level emitter (single instance)

Document-singletons — visibility, orientation, fullscreen, document
size — instantiate one `Emitter` at module load and destructure the
pair:

```jsx
import { Emitter } from 'pota/use/emitter'

export const { on: onDocumentVisible, use: useDocumentVisible } =
	new Emitter({
		on: dispatch => {
			const handler = () =>
				dispatch(document.visibilityState === 'visible')
			document.addEventListener('visibilitychange', handler)
			return () =>
				document.removeEventListener('visibilitychange', handler)
		},
		initialValue: () => document.visibilityState === 'visible',
	})
```

## Element-level emitter (one per node)

For per-element observers, key an Emitter per node (here with a
`WeakMap`) so multiple subscribers on the same element share one
observer and disconnect together:

```jsx
import { Emitter } from 'pota/use/emitter'

const emitters = new WeakMap()

const getEmitter = node => {
	let e = emitters.get(node)
	if (!e) {
		e = new Emitter({
			on: dispatch => {
				const io = new IntersectionObserver(entries =>
					dispatch(entries[0]),
				)
				io.observe(node)
				return () => io.disconnect()
			},
		})
		emitters.set(node, e)
	}
	return e
}

export const useVisible = node => getEmitter(node).use()
export const onVisible = (node, fn) =>
	getEmitter(node).on(entry => {
		if (entry !== undefined) fn(entry)
	})
```

This is the pattern used by [intersection](/use/intersection),
[mutation](/use/mutation), and the element-level half of
[resize](/use/resize).

## Initial-undefined quirk

If `initialValue` is omitted, the signal is initialized to
`undefined`. The first effect run sees that placeholder before the
source has fired. Ways to handle it:

1. Provide `initialValue` when a synchronous read of the source is
   possible (visibility, orientation, fullscreen — see
   [visibility](/use/visibility) for the pattern).
2. Filter at the public API: the `on*` wrappers in
   [intersection](/use/intersection) / [mutation](/use/mutation) guard
   with `if (entry !== undefined) fn(entry)` because observers can't
   be read synchronously before they fire.

## Examples

### Reactive value from a window event

Wrap a window event source as an `Emitter` and read `use()` directly
in JSX. The accessor is reactive, so the text re-renders on every
resize; the listener is added by the `use()` call itself and removed
on unmount.

```jsx
import { render } from 'pota'
import { Emitter } from 'pota/use/emitter'

const width = new Emitter({
	on: dispatch => {
		const handler = () => dispatch(window.innerWidth)
		window.addEventListener('resize', handler)
		return () => window.removeEventListener('resize', handler)
	},
	initialValue: () => window.innerWidth,
})

function App() {
	const useWidth = width.use()
	return <p>window width: {useWidth}px</p>
}

render(App)
```

### Side-effect callback with `on`

`on(fn)` forwards each emitted value to a callback instead of
returning an accessor. Use it for side effects that don't render
reactive markup. It counts as a subscriber just like `use()`, so the
source is shared and torn down on cleanup.

```jsx
import { render, signal } from 'pota'
import { Emitter } from 'pota/use/emitter'

const visible = new Emitter({
	on: dispatch => {
		const handler = () =>
			dispatch(document.visibilityState === 'visible')
		document.addEventListener('visibilitychange', handler)
		return () =>
			document.removeEventListener('visibilitychange', handler)
	},
	initialValue: () => document.visibilityState === 'visible',
})

function App() {
	const log = signal('switch tabs and check the status')
	visible.on(isVisible => {
		log.write(`tab is ${isVisible ? 'visible' : 'hidden'}`)
	})
	return <p>{log.read}</p>
}

render(App)
```
