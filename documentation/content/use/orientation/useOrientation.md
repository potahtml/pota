---
title: useOrientation
subpath: pota/use/orientation
topic: Browser
desc: Signal accessor for the current orientation.
---

# useOrientation

`useOrientation()` returns a signal accessor for the current screen
orientation, from [`pota/use/orientation`](/use/orientation). The
classification is `width >= height ? 'horizontal' : 'vertical'`, so
square viewports report `'horizontal'`. It updates as the window
resizes (including device rotation).

## Arguments

`useOrientation()` takes no arguments.

**Returns:** a signal accessor (reader function) yielding
`'horizontal' | 'vertical'`. Pass it directly as a child or prop to
keep it reactive; it shares the underlying
[`documentSize`](/use/resize) listener with other subscribers. For a
side-effecting callback instead of a reactive value, use
[`onOrientation`](/use/orientation/onOrientation).

## Examples

### Display the current orientation

Renders the live orientation. The accessor is passed as a child, so
the text updates on every resize without an effect.

```jsx
import { render } from 'pota'
import { useOrientation } from 'pota/use/orientation'

function App() {
	const orientation = useOrientation()

	return (
		<div>
			<p>
				Current orientation: <strong>{orientation}</strong>
			</p>
			<p>
				<em>resize the window to flip it.</em>
			</p>
		</div>
	)
}

render(App)
```

### Swap layouts by orientation

Picks a different layout per orientation with
[`Show`](/components/Show), driving its `when` from the accessor.

```jsx
import { render } from 'pota'
import { Show } from 'pota/components'
import { useOrientation } from 'pota/use/orientation'

function App() {
	const orientation = useOrientation()
	const isWide = () => orientation() === 'horizontal'

	return (
		<Show
			when={isWide}
			fallback={<aside>stacked layout</aside>}
		>
			<section>side-by-side layout</section>
		</Show>
	)
}

render(App)
```
