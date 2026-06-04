---
title: onElementSize
subpath: pota/use/resize
topic: Observers
desc: Register a ResizeObserver callback for an element.
---

# onElementSize

`onElementSize(node, fn)` registers a callback invoked with each
`ResizeObserverEntry` for `node`. The callback is _not_ invoked with
the pre-observer placeholder — only with real entries. Its accessor
counterpart is [`useElementSize`](/use/resize/useElementSize); for the
concise `use:ref` form use [`resize`](/use/resize). Subscribers on the
same node share a single `ResizeObserver`. Part of
[`pota/use/resize`](/use/resize).

## Arguments

| Argument | Type                                   | Description                               |
| -------- | -------------------------------------- | ----------------------------------------- |
| `node`   | `Element`                              | The element to observe.                   |
| `fn`     | `(entry: ResizeObserverEntry) => void` | Called with each resize entry for `node`. |

## Examples

### Observe an element with a ref

Grabs the node from `use:ref`, then registers a resize callback that
logs the new content-box dimensions.

```jsx
import { render } from 'pota'
import { onElementSize } from 'pota/use/resize'

function App() {
	return (
		<div
			use:ref={node => {
				onElementSize(node, entry => {
					console.log(
						'resized',
						entry.contentRect.width,
						entry.contentRect.height,
					)
				})
			}}
			style={{
				resize: 'both',
				overflow: 'auto',
				width: '200px',
				height: '120px',
				padding: '1rem',
				border: '1px solid #aaa',
			}}
		>
			resize me — watch the console
		</div>
	)
}

render(App)
```
