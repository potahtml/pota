---
title: mousePosition
subpath: pota/use/mouse
topic: Input
desc: Non-reactive snapshot of the pointer position.
---

# mousePosition

`mousePosition()` returns a fresh `{ x, y }` snapshot of the current
pointer position in client coordinates. It is **not** reactive — call
it whenever you need the latest value, e.g. inside a
`requestAnimationFrame` loop or an event handler, where subscribing
would be wasted overhead. It does read a signal under the hood, so
calling it inside a tracked scope (an effect or memo) would subscribe
after all — for reactive reads use
[`useMousePosition`](/use/mouse/useMousePosition) instead.

The first call lazily installs the shared `window` listeners.

**Returns:** `{ x: number; y: number }` — a fresh object with the
current client position.

## Examples

### Read the position on demand

Sample the latest position from an event handler without subscribing
to every move.

```jsx
import { render, signal } from 'pota'
import { mousePosition } from 'pota/use/mouse'

function App() {
	const pos = signal('move the mouse')

	function logHere() {
		const { x, y } = mousePosition()
		pos.write(`clicked at ${x}, ${y}`)
	}

	return (
		<div>
			<button on:click={logHere}>where am I?</button>
			<p>{pos.read}</p>
		</div>
	)
}

render(App)
```
