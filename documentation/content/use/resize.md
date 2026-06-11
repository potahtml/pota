---
title: resize
subpath: pota/use/resize
topic: Observers
desc:
  Document-level and element-level resize behind one use*/on* Emitter
  pattern.
---

# `pota/use/resize`

`pota/use/resize` exposes document-level and element-level resize
behind one `use* / on*` Emitter pattern. Document size tracks the
window `resize` event; element size is backed by a `ResizeObserver`.
Each pair gives you a reactive accessor (`use*`) and a plain callback
registration (`on*`), and the module also ships two `use:ref` helpers
— the `resize(handler)` factory for per-element callbacks and
[`ensureInBounds`](/use/resize/ensureInBounds), a ref used directly to
clamp a floating element to the viewport.

The module's own `resize` export is documented inline below.

## Exports

- `resize(handler)` — concise `use:ref` element-resize factory
  (documented below)
- [`documentSize()`](/use/resize/documentSize) — `{ width, height }`
  viewport snapshot
- [`onDocumentSize(fn)`](/use/resize/onDocumentSize) — callback on
  viewport resize
- [`useDocumentSize()`](/use/resize/useDocumentSize) — reactive
  viewport size accessor
- [`useElementSize(node)`](/use/resize/useElementSize) — reactive
  element size accessor
- [`onElementSize(node, fn)`](/use/resize/onElementSize) — callback on
  element resize
- [`ensureInBounds`](/use/resize/ensureInBounds) — ref: clamp an
  element to the viewport

## Arguments

`resize(handler)` returns a `use:ref` factory.

| Argument  | Type                                   | Description                                                |
| --------- | -------------------------------------- | ---------------------------------------------------------- |
| `handler` | `(entry: ResizeObserverEntry) => void` | Called with the latest entry whenever the element resizes. |

**Returns:** a ref function `(node: Element) => void` for `use:ref`.

Multiple subscribers on the same node share a single `ResizeObserver`.

## Examples

### Element resize via use:ref

The most concise form: attach with `use:ref` and the handler receives
each `ResizeObserverEntry`. Drag the box corner to see the reported
size update.

```jsx
import { render, signal } from 'pota'
import { resize } from 'pota/use/resize'

function App() {
	const size = signal({ width: 0, height: 0 })

	return (
		<div
			use:ref={resize(entry => {
				size.write({
					width: Math.round(entry.contentRect.width),
					height: Math.round(entry.contentRect.height),
				})
			})}
			style={{
				resize: 'both',
				overflow: 'auto',
				width: '300px',
				height: '200px',
				padding: '1rem',
				border: '1px solid #aaa',
			}}
		>
			drag the bottom-right corner to resize. current:{' '}
			<mark>
				{() => size.read().width}×{() => size.read().height}
			</mark>
		</div>
	)
}

render(App)
```
