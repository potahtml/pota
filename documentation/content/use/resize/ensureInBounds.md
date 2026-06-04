---
title: ensureInBounds
subpath: pota/use/resize
topic: Observers
desc:
  Ref — clamp an element's max size to keep it inside the viewport.
---

# ensureInBounds

`ensureInBounds` is a bare `use:ref` function. At mount it snapshots
the element's top-left corner via `getBoundingClientRect`, then writes
a `max-width` / `max-height` that keeps the element's right and bottom
edges inside the viewport — recomputed on every viewport resize via
[`useDocumentSize`](/use/resize/useDocumentSize). When the box already
fits, the clamps are set back to `null`.

Because the anchor is sampled **once**, this fits floating panels —
popovers, dropdowns, color pickers, tooltips — whose top-left anchor
doesn't move during their lifetime. If the anchor moves, drop and
re-attach the ref. Part of [`pota/use/resize`](/use/resize).

## Arguments

`ensureInBounds` is used directly as a ref — you pass the function
itself, not a call. It receives the element node from `use:ref`.

| Argument | Type          | Description                                  |
| -------- | ------------- | -------------------------------------------- |
| `node`   | `HTMLElement` | The element to clamp, supplied by `use:ref`. |

## Examples

### Clamp a panel to the viewport

Attaches `ensureInBounds` to a panel anchored near the screen edge;
shrink the window and the panel's `max-width` / `max-height` shrink so
it stays fully visible.

```jsx
import { render } from 'pota'
import { ensureInBounds } from 'pota/use/resize'

function App() {
	return (
		<div
			use:ref={ensureInBounds}
			style={{
				position: 'fixed',
				top: '20px',
				right: '20px',
				width: '320px',
				height: '480px',
				padding: '1rem',
				border: '1px solid #aaa',
				overflow: 'auto',
			}}
		>
			a floating panel that never overflows the viewport
		</div>
	)
}

render(App)
```
