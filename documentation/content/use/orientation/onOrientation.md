---
title: onOrientation
subpath: pota/use/orientation
topic: Browser
desc: Callback fired whenever the orientation flips.
---

# onOrientation

`onOrientation(fn)` calls `fn` whenever the screen orientation flips
between `'horizontal'` and `'vertical'` — handy for swapping layouts
or re-laying-out a canvas. Multiple subscribers share the underlying
[`documentSize`](/use/resize) listener. For a reactive accessor use
[`useOrientation`](/use/orientation/useOrientation).

## Arguments

| Argument | Type                                      | Description                        |
| -------- | ----------------------------------------- | ---------------------------------- |
| `fn`     | `(o: 'horizontal' \| 'vertical') => void` | Called on each orientation change. |

The callback fires once with the current orientation on subscribe,
then again on every flip. It runs inside the calling reactive scope,
so the subscription is torn down automatically when that scope
disposes.

## Examples

### Log orientation changes

Subscribes to orientation flips and logs the new value. Resize the
window (or rotate the device) to see it fire.

```jsx
import { render, signal } from 'pota'
import { onOrientation } from 'pota/use/orientation'

function App() {
	const log = signal('resize to see orientation changes')

	onOrientation(o => {
		log.write(`orientation is now ${o}`)
	})

	return <p>{log.read}</p>
}

render(App)
```

### Re-layout a canvas on rotation

Reaches for the callback form when the reaction is an imperative side
effect — here, redrawing a canvas — rather than reactive markup.

```jsx
import { render } from 'pota'
import { onOrientation } from 'pota/use/orientation'

function App() {
	let canvas

	onOrientation(o => {
		if (!canvas) return
		const ctx = canvas.getContext('2d')
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		ctx.fillStyle = o === 'horizontal' ? 'teal' : 'tomato'
		ctx.fillRect(0, 0, canvas.width, canvas.height)
	})

	return (
		<canvas
			use:ref={el => (canvas = el)}
			width="200"
			height="120"
		/>
	)
}

render(App)
```
