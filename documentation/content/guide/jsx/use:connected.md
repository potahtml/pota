---
title: use:connected
subpath: pota
topic: Lifecycles
desc: Run a callback once the element is connected to the document.
---

# `use:connected`

Element attribute that runs its callback once the element is connected
to the document. Available only as an attribute on elements (not as a
standalone lifecycle — that's [ready](/ready)). Accepts a single
callback or an array of callbacks; each receives the element.

`use:connected` callbacks run after the current batch of nodes has
been inserted into the document, before paint, in recursive order, and
before the `ready` callbacks. Because the value is a function
`(node) => void`, you can also pass a [ref](/ref) signal here to have
the reference land at mount time — see [use:ref](/guide/jsx/use:ref).

## Arguments

| name    | type                       | description                                              |
| ------- | -------------------------- | -------------------------------------------------------- |
| `value` | `fn` \| `fn[]` (any depth) | function(s) called with the element once it is connected |

## Examples

### Run on mount

The callback fires once the element is in the document, after
insertion and before paint.

```jsx
import { render, signal } from 'pota'

function App() {
	const log = signal('')
	return (
		<div>
			<main
				use:connected={node => log.write(`${node.tagName} connected`)}
			>
				Content
			</main>
			<p>{log.read}</p>
		</div>
	)
}

render(App)
```
