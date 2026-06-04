---
title: documentSize
subpath: pota/use/resize
topic: Observers
desc: Non-reactive { width, height } snapshot of the viewport.
---

# documentSize

`documentSize()` returns a non-reactive `{ width, height }` snapshot
of the document element's size — it reads
`documentElement.clientWidth` and `clientHeight` once and does not
track. For a reactive accessor that re-runs effects on every window
resize, use [`useDocumentSize`](/use/resize/useDocumentSize). Part of
[`pota/use/resize`](/use/resize).

## Arguments

`documentSize()` takes no arguments.

**Returns:** `{ width: number, height: number }` — the viewport
dimensions at the moment of the call.

## Examples

### Read the current viewport size

Calls `documentSize()` once on render and shows the static dimensions.
Because the value is a plain snapshot, it does not update on resize —
reach for [`useDocumentSize`](/use/resize/useDocumentSize) when you
need that.

```jsx
import { render } from 'pota'
import { documentSize } from 'pota/use/resize'

function App() {
	const { width, height } = documentSize()

	return (
		<p>
			viewport: {width}×{height}
		</p>
	)
}

render(App)
```
