---
title: useElementSize
subpath: pota/use/resize
topic: Observers
desc: Reactive size accessor for an element (ResizeObserver).
---

# useElementSize

When you already have a node reference, `useElementSize(node)` gives
you a signal accessor that re-runs effects on every size change,
backed by a `ResizeObserver`. The callback counterpart is
[`onElementSize`](/use/resize/onElementSize); for the concise
`use:ref` form use [`resize`](/use/resize). Part of
[`pota/use/resize`](/use/resize).

## Examples

### Live size readout

Attach `useElementSize` to a node and derive displayed text from its
reactive accessor. The accessor yields the latest
`ResizeObserverEntry`, so read `contentRect` for the current
dimensions.

```jsx
import { render } from 'pota'

import { useElementSize } from 'pota/use/resize'

function App() {
	let size

	return (
		<>
			<div
				use:ref={node => {
					size = useElementSize(node)
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
				resize me
			</div>

			<p>
				{() => {
					const entry = size()
					return entry
						? `${Math.round(entry.contentRect.width)} × ${Math.round(entry.contentRect.height)}`
						: 'measuring…'
				}}
			</p>
		</>
	)
}

render(App)
```

### Callback counterpart

Use [`onElementSize`](/use/resize/onElementSize) when you want a
side-effecting callback instead of an accessor — it fires only with
real `ResizeObserverEntry`s, never the pre-observer placeholder.

```jsx
import { render, signal } from 'pota'
import { onElementSize } from 'pota/use/resize'

function App() {
	const size = signal('resize me')

	return (
		<div
			use:ref={node => {
				onElementSize(node, entry => {
					size.write(
						`resized ${Math.round(entry.contentRect.width)} × ${Math.round(entry.contentRect.height)}`,
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
			{size.read}
		</div>
	)
}

render(App)
```
