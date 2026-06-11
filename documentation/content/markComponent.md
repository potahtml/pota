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

### Marked vs. plain function child

The same function body twice as a child: the plain one is a reactive
expression that rebuilds its paragraph on every `count` change, the
marked one runs once, untracked.

```jsx
import { markComponent, render, signal } from 'pota'

function App() {
	const count = signal(0)

	const tracked = () => <p>rebuilt at count = {count.read()}</p>
	const marked = markComponent(() => (
		<p>created once at count = {count.read()}</p>
	))

	return (
		<div>
			<button on:click={() => count.update(n => n + 1)}>+1</button>
			{tracked}
			{marked}
		</div>
	)
}

render(App)
```
