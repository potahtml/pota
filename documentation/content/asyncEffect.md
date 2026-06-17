---
title: asyncEffect
subpath: pota
topic: Reactive core
desc:
  Effect for async work, serialised by default — each run receives the
  previous run's promise to await.
---

# asyncEffect

Effect for async work, serialised by default. On each run the callback
receives the promise from the previous run (or `undefined` on the
first); awaiting that promise guarantees one run finishes before the
next begins. For synchronous effects see [effect](/effect) /
[syncEffect](/syncEffect).

## Arguments

| name | type                                       | description                                                                                                               |
| ---- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `fn` | `(prev: Promise<any> \| undefined) => any` | async (or sync) function that receives the previous run's promise. Return value is awaited before the run is marked done. |

**Returns:** `void`.

## Examples

### Sequential async

Awaiting `prev` serialises the work — useful for chained network
requests where overlapping is wrong (stale results clobbering current
ones, parallel writes racing on the server). Read `id` _before_
awaiting `prev` so each run captures its own value.

```jsx
import { asyncEffect, render, signal } from 'pota'

// stands in for a real request — resolves after a short delay
const fetchItem = id =>
	new Promise(resolve =>
		setTimeout(() => resolve({ id, name: `Item ${id}` }), 500),
	)

function App() {
	const id = signal(1)
	const data = signal(null)

	asyncEffect(async prev => {
		const current = id.read()
		await prev
		data.write(await fetchItem(current))
	})

	return (
		<div>
			<button on:click={() => id.update(n => n + 1)}>next</button>
			<pre>{() => JSON.stringify(data.read(), null, 2)}</pre>
		</div>
	)
}

render(App)
```
