---
title: mouse
subpath: pota/use/mouse
topic: Input
desc:
  Document-wide mouse button and pointer tracking via Pointer Events.
---

# `pota/use/mouse`

Tracks held mouse buttons and the pointer position document-wide,
backed by Pointer Events (not Mouse Events) — so back / forward
buttons report and pen / touch input is covered.

Listeners are shared across all subscribers: any number of callers
cost a single set of `window` listeners, installed on first use and
removed when the last one goes away. A `pointerup` always releases its
button (so a button can't get stuck), and a window `blur` —
alt-tabbing while holding — releases everything.

## Exports

- [`useMouseButton(button)`](/use/mouse/useMouseButton) — reactive
  boolean: is a button held?
- [`mouseButtons()`](/use/mouse/mouseButtons) — live, non-reactive
  `Set<number>` of held buttons
- [`useMousePosition()`](/use/mouse/useMousePosition) — reactive
  `{ x, y }` pointer position
- [`mousePosition()`](/use/mouse/mousePosition) — non-reactive
  `{ x, y }` snapshot

## Button numbers

Button indices follow `PointerEvent.button`:

- `0` — primary (left)
- `1` — auxiliary (middle / wheel)
- `2` — secondary (right)
- `3` — back
- `4` — forward

## Examples

### Track the pointer position

Reactively render the live `{ x, y }` client coordinates. Pass the
reader function returned by `useMousePosition` so the text updates as
the pointer moves.

```jsx
import { useMousePosition } from 'pota/use/mouse'
import { render } from 'pota'

function App() {
	const pos = useMousePosition()
	return <pre>{() => `x: ${pos().x}, y: ${pos().y}`}</pre>
}

render(App)
```

### Show whether a button is held

`useMouseButton(button)` returns a reactive boolean accessor. Here the
left button drives a [Show](/components/Show); right-clicking would
use button `2` instead.

```jsx
import { useMouseButton } from 'pota/use/mouse'
import { Show } from 'pota/components'
import { render } from 'pota'

function App() {
	const leftDown = useMouseButton(0)
	return (
		<Show
			when={leftDown}
			fallback={<p>release</p>}
		>
			<p>left button held</p>
		</Show>
	)
}

render(App)
```

### Poll held buttons in a render loop

`mouseButtons()` exposes the live, non-reactive `Set` of held button
indices, and `mousePosition()` takes a fresh snapshot — both ideal
inside a `requestAnimationFrame` loop where reactive tracking would be
wasted overhead. Treat the returned set as read-only.

```jsx
import { mouseButtons, mousePosition } from 'pota/use/mouse'
import { render } from 'pota'

function App() {
	const out = <output>idle</output>

	const tick = () => {
		const held = [...mouseButtons()]
		const { x, y } = mousePosition()
		out.textContent = `buttons: [${held}] at ${x},${y}`
		requestAnimationFrame(tick)
	}
	requestAnimationFrame(tick)

	return out
}

render(App)
```
