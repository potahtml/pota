---
title: usePrevious
subpath: pota/use/selector
topic: Reactive helpers
desc: Wrap a function so it receives its previous return value.
---

# usePrevious

`usePrevious(fn)` wraps `fn` so that on every call it receives the
previous return value as its second argument — useful for transitions,
deltas, or "compute from the previous state" patterns without an extra
signal. Part of [`pota/use/selector`](/use/selector).

The wrapper keeps the previous value in a closure variable, so it is
not reactive on its own; reach for it inside a derivation or effect
when you need to compare a value against the one it produced last
time.

## Arguments

| Argument | Type                    | Description                                                                |
| -------- | ----------------------- | -------------------------------------------------------------------------- |
| `fn`     | `(next, previous) => T` | Called with the current input and the value it returned on the prior call. |

**Returns:** a function `next => T` that runs `fn(next, previous)`,
stores the result as the new `previous`, and returns it. On the first
call `previous` is `undefined`.

## Examples

### Compute from the previous return

Wrap a reducer-style function so each call sees what it returned last
time. On the first call the previous value is `undefined`.

```jsx
import { render, signal } from 'pota'
import { usePrevious } from 'pota/use/selector'

function App() {
	const log = signal('')
	const step = usePrevious((next, prev) => {
		log.write(`was ${prev} → ${next}`)
		return next
	})

	return (
		<div>
			<p>{log.read}</p>
			<button on:click={() => step(1)}>step(1)</button>
			<button on:click={() => step(2)}>step(2)</button>
			<button on:click={() => step(5)}>step(5)</button>
		</div>
	)
}

render(App)
```
