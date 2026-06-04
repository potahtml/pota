---
title: scrollToElement
subpath: pota/use/scroll
topic: Browser
desc: Reset scrollTop and scroll a node into view.
---

# scrollToElement

`scrollToElement(node)` resets the node's `scrollTop` to `0` and then
calls `node.scrollIntoView(true)` — an imperative scroll to a node you
already hold. Part of [`pota/use/scroll`](/use/scroll); for a
declarative on-mount form use
[`scrollIntoView`](/use/scroll/scrollIntoView).

## Arguments

| Argument | Type      | Description               |
| -------- | --------- | ------------------------- |
| `node`   | `Element` | The element to scroll to. |

**Returns:** nothing.

## Examples

### Scroll to a node on click

Holds a ref to a far-down section and scrolls to it imperatively when
the button is clicked.

```jsx
import { render, signal } from 'pota'
import { scrollToElement } from 'pota/use/scroll'

function App() {
	const section = signal(null)

	return (
		<div>
			<button on:click={() => scrollToElement(section.read())}>
				scroll to section
			</button>

			<div style={{ height: '120vh' }}>spacer</div>

			<section use:ref={section.write}>Here it is</section>
		</div>
	)
}

render(App)
```
