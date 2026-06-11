---
title: useVisible
subpath: pota/use/intersection
topic: Observers
desc: Signal accessor for an element's intersection state.
---

# useVisible

When you already have a DOM node in hand, `useVisible(node, opts?)`
returns a signal accessor that reflects the latest
`IntersectionObserverEntry` for the node and re-runs whatever reads it
on every intersection change. It needs the real node at call time —
inside a `use:ref` function, or one created up front; a still-empty
ref won't do. For a side-effect callback use
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

`useVisible` needs an existing node, so the example creates one up
front, inserts it as a child, and reads `onscreen()` inside the
reactive child — subscribing to every intersection change.

```jsx
import { render } from 'pota'
import { useVisible } from 'pota/use/intersection'

function Tracker() {
	// the node exists before render — create it, then observe it
	const box = document.createElement('div')
	box.style.height = '120vh'
	box.textContent = 'scroll me'

	const onscreen = useVisible(box)

	return (
		<div>
			{box}
			<p>
				{() =>
					onscreen()?.isIntersecting ? 'on screen' : 'off screen'
				}
			</p>
		</div>
	)
}

render(Tracker)
```
