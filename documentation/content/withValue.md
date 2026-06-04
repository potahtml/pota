---
title: withValue
subpath: pota
topic: Reactive core
desc:
  Resolves a value (function, promise, or nested array of them) and
  calls fn with the result, re-running on change.
---

# withValue

Resolves `value` and calls `fn(resolved)`. Functions are unwrapped
inside a tracking scope, so `fn` re-runs whenever a tracked source
changes; promises and arrays of functions/promises are resolved
recursively. Plain values call `fn` immediately.

It is the helper to reach for when authoring a custom
[use:ref](/guide/jsx/use:ref) factory: it accepts the same
`Attribute<T>` flavor (`T | () => T | Promise<T>`) the rest of the
props pipeline expects, so the factory body stays concise.

## Arguments

| name    | type                                                              | description                                                                        |
| ------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `value` | `T \| () => T \| Promise<T> \| Array<T \| () => T \| Promise<T>>` | the value (or accessor) to resolve. Functions are tracked; promises are awaited.   |
| `fn`    | `(resolved: T) => void`                                           | called with the fully-resolved value, re-running whenever a tracked source changes |

**Returns:** `void`.

## Examples

### Custom ref factory

Wires a reactive attribute onto a node from inside a `use:ref` factory
— the factory re-runs `fn` whenever the signal changes.

```jsx
import { render, signal, withValue } from 'pota'

const title = value => node =>
	withValue(value, resolved => {
		node.setAttribute('title', String(resolved))
	})

function App() {
	const tip = signal('hover me')
	return (
		<div>
			<button use:ref={title(tip.read)}>hover</button>
			<button on:click={() => tip.write(`clicked at ${Date.now()}`)}>
				change tooltip
			</button>
		</div>
	)
}

render(App)
```
