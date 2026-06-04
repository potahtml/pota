---
title: useMousePosition
subpath: pota/use/mouse
topic: Input
desc: Reactive { x, y } pointer position in client coordinates.
---

# useMousePosition

`useMousePosition()` returns a reactive reader of the pointer's
position in client coordinates, updating as it moves. Part of
[`pota/use/mouse`](/use/mouse); the first call lazily installs the
shared `window` listeners.

For page coordinates add the current scroll offset; for
element-relative coordinates see [`pota/use/drag`](/use/drag). For a
non-reactive snapshot, use
[`mousePosition`](/use/mouse/mousePosition).

**Returns:** `() => { x: number; y: number }` — a reader of the
current client position.

## Examples

### Follow the pointer with a label

Pass the reader function and derive the displayed string from it, so
the label re-renders on each move.

```jsx
import { render } from 'pota'
import { useMousePosition } from 'pota/use/mouse'

function App() {
	const pos = useMousePosition()

	return <p>{() => `${pos().x}, ${pos().y}`}</p>
}

render(App)
```
