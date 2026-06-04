---
title: useDocumentSize
subpath: pota/use/resize
topic: Observers
desc:
  Reactive viewport size accessor (window resize), shared across
  subscribers.
---

# useDocumentSize

`useDocumentSize()` tracks the document element's `clientWidth` /
`clientHeight` and returns a signal reader — call it inside an effect
or pass it as a reactive child to re-run on every window resize. The
underlying Emitter is shared, so any number of subscribers attach a
single window `resize` listener. For a one-off snapshot use
[`documentSize`](/use/resize/documentSize); to register a plain
callback use [`onDocumentSize`](/use/resize/onDocumentSize). Part of
[`pota/use/resize`](/use/resize).

## Arguments

`useDocumentSize()` takes no arguments.

**Returns:** a signal reader for `{ width: number, height: number }`,
seeded with the current viewport size and updated on each window
resize.

## Examples

### Display the live viewport size

Reads the accessor as a reactive child so the dimensions update as the
window resizes.

```jsx
import { render } from 'pota'
import { useDocumentSize } from 'pota/use/resize'

function App() {
	const size = useDocumentSize()

	return (
		<p>
			viewport:{' '}
			<mark>
				{() => size().width}×{() => size().height}
			</mark>
		</p>
	)
}

render(App)
```
