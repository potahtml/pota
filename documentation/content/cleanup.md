---
title: cleanup
subpath: pota
topic: Reactive core
desc:
  Registers a callback that runs when the current tracking scope is
  disposed or recreated.
---

# cleanup

Registers a callback that runs when the current tracking scope is
disposed — typically a parent component unmount, [render](/render)'s
returned disposer being called, or a re-run [memo](/memo) recreating
its scope. Pair it with anything you set up imperatively (timers,
listeners, third-party instances) so it doesn't outlive the scope.

Callbacks run in reverse registration order (LIFO), after the elements
owned by the scope have been removed from the document. `cleanup`
returns the same `fn` it was given.

## Arguments

| name | type         | description                                         |
| ---- | ------------ | --------------------------------------------------- |
| `fn` | `() => void` | function to run once the tracking scope is disposed |

**Returns:** the same `fn`.

## Examples

### Clear a timer

A `setInterval` lives outside the reactive graph, so it must be torn
down by hand. Registering `clearInterval` with `cleanup` ties the
timer's lifetime to the component's.

```jsx
import { cleanup, render, signal } from 'pota'

function Clock() {
	const now = signal(new Date())

	const id = setInterval(() => now.write(new Date()), 1000)
	cleanup(() => clearInterval(id))

	return <p>{() => now.read().toLocaleTimeString()}</p>
}

render(Clock)
```

### Detach a manual listener

Anything attached imperatively to `window` or `document` outlives the
component unless you remove it. `cleanup` runs when the owner
disposes, so the listener goes away with the component.

```jsx
import { cleanup, render, signal } from 'pota'

function Keys() {
	const last = signal('')

	const onKey = e => last.write(e.key)
	window.addEventListener('keydown', onKey)
	cleanup(() => window.removeEventListener('keydown', onKey))

	return <p>last key: {last.read}</p>
}

render(Keys)
```

### Disposal ordering

`cleanup` callbacks run after the scope's DOM nodes have already been
removed, and child scopes dispose before their parents — so the
deepest cleanups fire first. Disposing the root here logs the nested
`cleanup:` lines from the inside out.

```jsx
import { cleanup, render } from 'pota'

function Child() {
	cleanup(() => console.log('cleanup: Child'))
	return <p>child</p>
}

function App() {
	cleanup(() => console.log('cleanup: App'))
	return (
		<main>
			<Child />
		</main>
	)
}

const dispose = render(App)

// later: tears down Child first, then App
dispose()
```
