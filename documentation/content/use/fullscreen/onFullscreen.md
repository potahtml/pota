---
title: onFullscreen
subpath: pota/use/fullscreen
topic: Browser
desc:
  Run a callback within a reactive scope whenever the fullscreen
  element changes.
---

# onFullscreen

`onFullscreen(fn)` calls `fn` with the current fullscreen element (or
`null`) whenever fullscreen changes — the callback form of the
[`pota/use/fullscreen`](/use/fullscreen) state. For a reactive
accessor use [`useFullscreen`](/use/fullscreen/useFullscreen).

It must be called **within a reactive scope** (a component body, an
[effect](/effect), a [root](/root), etc.). Internally it subscribes to
`fullscreenchange` inside an effect and registers its teardown with
the surrounding owner; when that scope disposes, the subscription is
removed. Called with no owner there is nothing to clean up the
listener and it leaks.

## Arguments

| Argument | Type                            | Description                                                |
| -------- | ------------------------------- | ---------------------------------------------------------- |
| `fn`     | `(el: Element \| null) => void` | Called with the current fullscreen element on each change. |

**Returns:** `undefined`.

## Examples

### Subscribe to changes

Logs the fullscreen element each time it changes. Because the
subscription is owned by the component, it is removed automatically
when the component unmounts.

```jsx
import { render, signal } from 'pota'
import { onFullscreen, fullscreen } from 'pota/use/fullscreen'

function App() {
	const log = signal('')
	onFullscreen(el => log.write(`fullscreen element: ${el?.tagName ?? 'none'}`))

	return (
		<div>
			<button use:ref={fullscreen()}>toggle fullscreen</button>
			<p>{log.read}</p>
		</div>
	)
}

render(App)
```
