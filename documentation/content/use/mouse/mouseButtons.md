---
title: mouseButtons
subpath: pota/use/mouse
topic: Input
desc: Live, non-reactive Set of currently held buttons.
---

# mouseButtons

`mouseButtons()` returns the live `Set<number>` of currently held
[buttons](/use/mouse#button-numbers), mutated in place — treat it as
read-only. It is **not** reactive: read it inside a
`requestAnimationFrame` loop or an event handler where subscribing
would be wasted overhead. For a reactive per-button boolean, use
[`useMouseButton`](/use/mouse/useMouseButton).

The first call lazily installs the shared `window` listeners.

**Returns:** `Set<number>` — the live set of held button indices.

## Examples

### Paint while dragging, in a rAF loop

Read the live set and the latest
[`mousePosition()`](/use/mouse/mousePosition) each frame instead of
subscribing, so the canvas only redraws while the primary button is
down.

```jsx
import { render } from 'pota'
import { mouseButtons, mousePosition } from 'pota/use/mouse'
import { useAnimationFrame } from 'pota/use/animate'

function App() {
	let canvas
	const held = mouseButtons()

	const ctx = () => canvas.getContext('2d')

	useAnimationFrame(() => {
		if (held.has(0)) {
			const { x, y } = mousePosition()
			const rect = canvas.getBoundingClientRect()
			ctx().fillRect(x - rect.left, y - rect.top, 4, 4)
		}
	}).start()

	return (
		<canvas
			width="400"
			height="300"
			use:ref={el => (canvas = el)}
		/>
	)
}

render(App)
```
