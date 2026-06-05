---
title: useMouseButton
subpath: pota/use/mouse
topic: Input
desc: Reactive boolean — whether a given mouse button is held.
---

# useMouseButton

`useMouseButton(button)` returns a reactive reader that is `true`
while the given [button](/use/mouse#button-numbers) is held, and
updates only when that button's state flips. Part of
[`pota/use/mouse`](/use/mouse); the first call lazily installs the
shared `window` listeners.

For a non-reactive snapshot of every held button, use
[`mouseButtons`](/use/mouse/mouseButtons).

## Arguments

| Argument | Type     | Description                                         |
| -------- | -------- | --------------------------------------------------- |
| `button` | `number` | Button index following `PointerEvent.button` (0–4). |

**Returns:** `() => boolean` — a reader, `true` while the button is
held.

## Examples

### Show which buttons are down

Render a live indicator per button by reading each reader in JSX. Pass
the reader function (`left`), not its result, so the text stays
reactive.

```jsx
import { render } from 'pota'
import { useMouseButton } from 'pota/use/mouse'

function App() {
	const left = useMouseButton(0)
	const middle = useMouseButton(1)
	const right = useMouseButton(2)

	return (
		<ul>
			<li>left: {() => (left() ? 'down' : 'up')}</li>
			<li>middle: {() => (middle() ? 'down' : 'up')}</li>
			<li>right: {() => (right() ? 'down' : 'up')}</li>
		</ul>
	)
}

render(App)
```

### Pan while the middle button is held

Drive an effect from the reader to start and stop panning as the
middle button toggles.

```jsx
import { effect } from 'pota'
import { useMouseButton } from 'pota/use/mouse'

const middle = useMouseButton(1)

const startPanning = () => console.log('start panning')
const stopPanning = () => console.log('stop panning')

effect(() => {
	if (middle()) startPanning()
	else stopPanning()
})
```
