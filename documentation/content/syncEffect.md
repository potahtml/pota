---
title: syncEffect
subpath: pota
topic: Reactive core
desc:
  Like effect, but the body runs synchronously when a dependency
  changes instead of on the next scheduler tick.
---

# syncEffect

Like [effect](/effect), but the body runs _synchronously_ when a
dependency changes instead of being queued for the next scheduler
tick. Pick it only when the side-effect must land before the current
call returns — for everything else, `effect` is the right primitive.

## Arguments

| name | type         | description                                  |
| ---- | ------------ | -------------------------------------------- |
| `fn` | `() => void` | function whose tracked reads become its deps |

**Returns:** `void`.

## Examples

### Synchronous snapshot

[effect](/effect) defers the body to the effects queue (fired after
the current update batch). `syncEffect` runs synchronously inside the
current batch — useful when you need a value computed _during_ the
same microtask, e.g. as part of a context setup or a one-shot read
used by the surrounding render.

```jsx
import { render, signal, syncEffect } from 'pota'

function App() {
	const count = signal(1)
	let snapshot

	syncEffect(() => {
		snapshot = count.read()
	})

	return (
		<div>
			<p>captured: {snapshot}</p>
			<button on:click={() => count.update(n => n + 1)}>
				bump (only the next syncEffect would update snapshot)
			</button>
		</div>
	)
}

render(App)
```
