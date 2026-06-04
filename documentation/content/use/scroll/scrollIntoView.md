---
title: scrollIntoView
subpath: pota/use/scroll
topic: Browser
desc: use:ref factory that scrolls the element into view on mount.
---

# scrollIntoView

`scrollIntoView(opts?)` returns a ref function that calls
`node.scrollIntoView(opts)` after the element is mounted. Options are
forwarded verbatim to the DOM method — pass
`{ behavior: 'smooth', block: 'center' }` for a centered scroll, or a
boolean for the two-argument form. Part of
[`pota/use/scroll`](/use/scroll).

## Arguments

| Argument | Type                                | Description                                           |
| -------- | ----------------------------------- | ----------------------------------------------------- |
| `opts`   | `boolean \| ScrollIntoViewOptions?` | Forwarded verbatim to `node.scrollIntoView` on mount. |

**Returns:** a `use:ref` factory `(node) => void`.

## Examples

### Scroll a list item into view

Marks one item in a scrollable list as the target and smoothly centers
it on mount via `use:ref`. Clicking the button re-mounts the
highlighted row, which re-triggers the scroll.

```jsx
import { render, signal } from 'pota'
import { For, Show } from 'pota/components'
import { scrollIntoView } from 'pota/use/scroll'

function App() {
	const selected = signal(null)
	const items = Array.from({ length: 30 }, (_, i) => i + 1)

	return (
		<div>
			<button on:click={() => selected.write(20)}>
				scroll to #20
			</button>
			<button
				on:click={() => selected.write(null)}
				style={{ 'margin-left': '0.5rem' }}
			>
				clear
			</button>

			<ul
				style={{
					height: '300px',
					overflow: 'auto',
					border: '1px solid #aaa',
				}}
			>
				<For each={items}>
					{item => (
						<Show
							when={() => selected.read() === item}
							fallback={<li>item {item}</li>}
						>
							<li
								use:ref={scrollIntoView({
									behavior: 'smooth',
									block: 'center',
								})}
								style={{
									background: 'mediumseagreen',
									color: 'white',
								}}
							>
								item {item} (target)
							</li>
						</Show>
					)}
				</For>
			</ul>
		</div>
	)
}

render(App)
```
