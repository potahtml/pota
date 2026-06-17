---
title: scrollToSelector
subpath: pota/use/scroll
topic: Browser
desc:
  Scroll to the first element matching a selector; returns success.
---

# scrollToSelector

`scrollToSelector(selector)` resolves a hash or CSS selector to an
element and scrolls to it with
[`scrollToElement`](/use/scroll/scrollToElement), returning `true` on
success and `false` on a miss. A leading `#` is resolved against
element ids first (`getElementById`, with the fragment URI-decoded) —
that handles ids that are valid HTML but invalid CSS selectors, like a
leading digit — before falling back to `querySelector`. An invalid or
empty selector is swallowed and returns `false` rather than throwing.
To fall back to the top of the page on a miss, use
[`scrollToSelectorWithFallback`](/use/scroll/scrollToSelectorWithFallback).
Part of [`pota/use/scroll`](/use/scroll).

## Arguments

| Argument   | Type     | Description                                         |
| ---------- | -------- | --------------------------------------------------- |
| `selector` | `string` | Hash (`#id`) or CSS selector for the scroll target. |

**Returns:** `true` when an element matched and was scrolled to,
`false` otherwise.

## Examples

### Scroll to a selector on click

Renders a target section and a button that scrolls to it by CSS
selector, logging whether the selector matched.

```jsx
import { render } from 'pota'
import { scrollToSelector } from 'pota/use/scroll'

function App() {
	return (
		<div>
			<button
				on:click={() => console.log(scrollToSelector('#section-3'))}
			>
				scroll to #section-3
			</button>

			<div style={{ height: '120vh' }}>spacer</div>

			<section id="section-3">section 3</section>
		</div>
	)
}

render(App)
```
