---
title: useVisible
subpath: pota/use/intersection
topic: Observers
desc: Signal accessor for an element's intersection state.
---

# useVisible

When you already have a ref to a node (e.g. from `use:ref`),
`useVisible(node, opts?)` returns a signal accessor that reflects the
latest `IntersectionObserverEntry` for the node and re-runs whatever
reads it on every intersection change. For a side-effect callback use
[`onVisible`](/use/intersection/onVisible); to attach an observer
declaratively use [`visible`](/use/intersection/visible). Part of
[`pota/use/intersection`](/use/intersection).

Multiple subscribers on the same node share one observer; `opts` from
later calls are ignored. The accessor reads `undefined` until the
first real entry arrives.

## Arguments

| Argument | Type                       | Description                                   |
| -------- | -------------------------- | --------------------------------------------- |
| `node`   | `Element`                  | Element to observe.                           |
| `opts`   | `IntersectionObserverInit` | Optional `root` / `rootMargin` / `threshold`. |

**Returns:** a signal accessor
`() => IntersectionObserverEntry | undefined`.

## Examples

### Read intersection reactively

Drives content from the accessor: reading `onscreen()` inside the
reactive child subscribes to every intersection change.

```jsx
import { render, ref } from 'pota'
import { useVisible } from 'pota/use/intersection'

function Tracker() {
	const node = ref()
	const onscreen = useVisible(node())

	return (
		<div
			use:ref={node}
			style={{ height: '120vh' }}
		>
			{() =>
				onscreen()?.isIntersecting ? 'on screen' : 'off screen'
			}
		</div>
	)
}

render(Tracker)
```
