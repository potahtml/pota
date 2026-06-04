---
title: Splitter
kind: component
subpath: pota/components
topic: Layout
desc:
  A draggable handle between two flex siblings that resizes one of
  them, optionally persisting the size.
---

# `<Splitter/>`

A resizable handle you drop between two sibling elements inside a flex
container. Dragging the handle resizes one of the siblings — width for
a vertical splitter, height for a horizontal one. Optionally persists
its size in `localStorage`.

## Attributes

| name           | type                         | description                                                                                                                                              |
| -------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `orientation?` | `'vertical' \| 'horizontal'` | Defaults to `'vertical'`. A vertical handle is dragged horizontally to resize `width`; a horizontal one the opposite. Also writes to `aria-orientation`. |
| `target?`      | `'prev' \| 'next'`           | Which sibling to resize. Defaults to `'prev'`; with `'next'` the handle grows the next sibling instead.                                                  |
| `min?`         | `number`                     | Minimum size in pixels. Defaults to `0`.                                                                                                                 |
| `max?`         | `number`                     | Maximum size in pixels. Defaults to `Infinity`.                                                                                                          |
| `initial?`     | `number`                     | Initial size in pixels, overriding what CSS would produce. Overridden in turn by a stored value when `persist` is set.                                   |
| `persist?`     | `string`                     | `localStorage` key. Reads on mount, writes on drag end. Omit to keep the splitter session-only.                                                          |
| `class?`       | `string`                     | Extra class applied to the handle, on top of the component's own auto-generated class.                                                                   |

## Examples

### Vertical splitter

Default orientation. The handle resizes the previous sibling's width —
useful for sidebar / content layouts.

```jsx
import { render } from 'pota'
import { Splitter } from 'pota/components'

function App() {
	return (
		<div
			style={{
				display: 'flex',
				height: '200px',
				border: '1px solid #aaa',
			}}
		>
			<aside
				style={{
					width: '200px',
					padding: '1rem',
					background: '#2a9d8f',
					color: 'white',
				}}
			>
				sidebar (drag the handle →)
			</aside>
			<Splitter
				min={100}
				max={400}
				initial={200}
			/>
			<main
				style={{
					flex: 1,
					padding: '1rem',
					background: '#264653',
					color: 'white',
				}}
			>
				content
			</main>
		</div>
	)
}

render(App)
```

### Horizontal splitter with persistence

Pass `orientation="horizontal"` for a handle that resizes height. With
`persist`, the size is restored from `localStorage` the next time the
page loads.

```jsx
import { render } from 'pota'
import { Splitter } from 'pota/components'

function App() {
	return (
		<div
			style={{
				display: 'flex',
				'flex-direction': 'column',
				height: '300px',
				border: '1px solid #aaa',
			}}
		>
			<section
				style={{
					padding: '1rem',
					background: '#e76f51',
					color: 'white',
				}}
			>
				top (drag the handle ↓ — refresh the page to see persistence)
			</section>
			<Splitter
				orientation="horizontal"
				min={50}
				max={250}
				initial={120}
				persist="docs:splitter-demo"
			/>
			<section
				style={{
					flex: 1,
					padding: '1rem',
					background: '#f4a261',
				}}
			>
				bottom
			</section>
		</div>
	)
}

render(App)
```

### No JSX (compiler-less)

`Splitter` is built with [Component](/Component) calls rather than
JSX, so it works in compiler-less setups alongside the [xml](/xml/xml)
tagged-template API — same shape, no Babel preset required.

```js
import { Component, render } from 'pota'
import { Splitter } from 'pota/components'

const App = () =>
	Component('div', {
		style: 'display: flex; height: 200px',
		children: [
			Component('aside', {
				style: 'width: 200px; background: #2a9d8f',
			}),
			Component(Splitter, { min: 100, max: 400 }),
			Component('main', { style: 'flex: 1; background: #264653' }),
		],
	})

render(App)
```
