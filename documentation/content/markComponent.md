---
title: markComponent
subpath: pota
topic: Renderer
desc:
  Flags a function as a component so the renderer invokes it untracked
  instead of as a reactive expression.
---

# markComponent

`markComponent(fn)` flags `fn` as a component — when the renderer sees
a marked function as a child it invokes it untracked (signals read
inside don't re-run the parent), which is the right semantic for
components vs. reactive expressions. Hand-roll this when you build a
component factory that bypasses JSX.

The flag can be read back with [isComponent](/isComponent).

## Arguments

| name | type             | description          |
| ---- | ---------------- | -------------------- |
| `fn` | `(...args) => T` | the function to mark |

**Returns:** the same `fn`, now tagged as a component.

## Examples

### Component factory

Builds reusable components outside JSX; each marked function runs
untracked, so its internal signal doesn't leak reactivity to the
parent.

```jsx
import { markComponent, render, signal } from 'pota'

function makeCounter(initial) {
	return markComponent(() => {
		const n = signal(initial)
		return (
			<button on:click={() => n.update(v => v + 1)}>{n.read}</button>
		)
	})
}

const A = makeCounter(0)
const B = makeCounter(100)

function App() {
	return (
		<div>
			<A />
			<B />
		</div>
	)
}

render(App)
```
