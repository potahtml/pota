---
title: scrollToSelectorWithFallback
subpath: pota/use/scroll
topic: Browser
desc:
  Scroll to a selector, falling back to the top of the page on a miss.
---

# scrollToSelectorWithFallback

`scrollToSelectorWithFallback(selector)` behaves like
[`scrollToSelector`](/use/scroll/scrollToSelector) but falls back to
[`scrollToTop`](/use/scroll/scrollToTop) when the selector matches
nothing. Part of [`pota/use/scroll`](/use/scroll).

## Arguments

| Argument   | Type     | Description                         |
| ---------- | -------- | ----------------------------------- |
| `selector` | `string` | CSS selector for the scroll target. |

**Returns:** nothing.

## Examples

### Scroll with a fallback to the top

Tries to scroll to a selector that may or may not exist; when it is
missing the page scrolls back to the top instead.

```jsx
import { render } from 'pota'
import { scrollToSelectorWithFallback } from 'pota/use/scroll'

function App() {
	return (
		<div>
			<button
				on:click={() =>
					scrollToSelectorWithFallback('#maybe-present')
				}
			>
				scroll, or jump to top
			</button>

			<div style={{ height: '120vh' }}>spacer</div>

			<section id="present">present section</section>
		</div>
	)
}

render(App)
```
