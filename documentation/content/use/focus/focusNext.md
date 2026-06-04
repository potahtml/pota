---
title: focusNext
subpath: pota/use/focus
topic: Interaction
desc:
  Imperatively advance focus through focusable elements, with
  wrap-around.
---

# focusNext

`focusNext(list?)` moves focus to the next tabbable element after the
currently active one, skipping disabled elements and wrapping back to
the start when it reaches the end. Called with no arguments it scans
the whole document; pass an explicit array to scope the cycle to a
subset. To step backward use
[`focusPrevious`](/use/focus/focusPrevious). Part of
[`pota/use/focus`](/use/focus).

## Arguments

| Argument | Type            | Description                                                                                           |
| -------- | --------------- | ----------------------------------------------------------------------------------------------------- |
| `list`   | `HTMLElement[]` | Optional ordered set of candidates. Defaults to every tabbable element in the document, in DOM order. |

The default candidate set is `input` (non-hidden), `button`, `select`,
`textarea`, `a`, `[tabindex]`, and `[contenteditable]` elements.

## Examples

### Advance focus on a key

A document-wide "next field" action wired to a button, mirroring the
browser's <kbd>Tab</kbd> with wrap-around.

```jsx
import { render } from 'pota'
import { focusNext, focusPrevious } from 'pota/use/focus'

function App() {
	return (
		<form>
			<input placeholder="one" />
			<input placeholder="two" />
			<input placeholder="three" />
			<button
				type="button"
				on:click={() => focusPrevious()}
			>
				prev
			</button>
			<button
				type="button"
				on:click={() => focusNext()}
			>
				next
			</button>
		</form>
	)
}

render(App)
```
