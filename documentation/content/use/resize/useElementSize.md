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

`useElementSize` takes the node itself, so obtain the node before
rendering — here a natively-resizable `textarea` is created up front,
rendered as a child, and its accessor drives the readout. The accessor
yields the latest `ResizeObserverEntry` (`undefined` until the first
observation), so read `contentRect` for the current dimensions. Don't
capture the accessor from inside `use:ref` and read it in a sibling
child — children render before refs fire; when the node only exists in
JSX, use the [`resize`](/use/resize) ref factory or
[`onElementSize`](/use/resize/onElementSize) instead.

```jsx
import { render } from 'pota'
import { useElementSize } from 'pota/use/resize'

function App() {
	const box = document.createElement('textarea')
	box.value = 'resize me'

	const size = useElementSize(box)

	return (
		<>
			{box}
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
