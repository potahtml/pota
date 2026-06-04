---
title: onDocumentSize
subpath: pota/use/resize
topic: Observers
desc: Register a callback for viewport (window resize) changes.
---

# onDocumentSize

`onDocumentSize(fn)` registers a callback invoked with the current
`{ width, height }` whenever the viewport size changes. It is the
callback half of the shared viewport Emitter whose accessor half is
[`useDocumentSize`](/use/resize/useDocumentSize); all subscribers
share a single window `resize` listener. The emitter is seeded with
[`documentSize`](/use/resize/documentSize), so the callback also fires
once with the initial value. Part of [`pota/use/resize`](/use/resize).

## Arguments

| Argument | Type                                                | Description                              |
| -------- | --------------------------------------------------- | ---------------------------------------- |
| `fn`     | `(size: { width: number, height: number }) => void` | Called with the viewport size on change. |

## Examples

### Log the viewport on resize

Registers a callback that fires with the initial size and again on
every window resize.

```jsx
import { render } from 'pota'
import { onDocumentSize } from 'pota/use/resize'

function App() {
	onDocumentSize(({ width, height }) => {
		console.log('viewport:', width, height)
	})

	return <p>resize the window — watch the console</p>
}

render(App)
```
