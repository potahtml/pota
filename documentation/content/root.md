---
title: root
subpath: pota
topic: Reactive core
desc:
  Creates a top-level tracking scope; the callback receives a dispose
  function that tears down everything inside.
---

# root

Creates a new top-level tracking scope. The callback receives a
`dispose` function that tears down everything created inside. Reactive
work that outlives a component (long-lived subscriptions, imperative
rendering, stores instantiated at module load) belongs in a `root`.
[render](/render) creates one for you internally; call `root` directly
when there's no render tree.

## Arguments

| name       | type             | description                                                 |
| ---------- | ---------------- | ----------------------------------------------------------- |
| `fn`       | `(dispose) => T` | runs once, immediately. Receives the disposer for the root. |
| `options?` | `EffectOptions`  | optional owner options assigned onto the root.              |

**Returns:** the return value of `fn`.

## Examples

### Detached scope with manual dispose

`root` runs `fn` in a new owner that is _not_ attached to any parent —
so cleanups stick around until you call the disposer `fn` received.
Use it for reactive code outside a component tree (workers, modal
managers, background timers).

```jsx
import { effect, root, signal } from 'pota'

const dispose = root(dispose => {
	const ticks = signal(0)

	effect(() => {
		document.title = `ticks: ${ticks.read()}`
	})

	const id = setInterval(() => ticks.update(n => n + 1), 1000)

	// when the caller disposes the root, stop the timer too
	return () => {
		clearInterval(id)
		dispose()
	}
})

// later, e.g. on hot-reload or page teardown:
// dispose()
```

### Module-level reactive store

Wrapping a module's reactive setup in `root` gives those primitives
their own owner — they don't get cleaned up when a component unmounts,
and any cleanups they register live for the whole page.

```jsx
import { effect, root, signal } from 'pota'

export const session = root(() => {
	const user = signal(null)

	effect(() => {
		if (user.read()) {
			document.documentElement.classList.add('logged-in')
		} else {
			document.documentElement.classList.remove('logged-in')
		}
	})

	return {
		user: user.read,
		login: u => user.write(u),
		logout: () => user.write(null),
	}
})
```
