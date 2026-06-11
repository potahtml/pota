---
title: focusPrevious
subpath: pota/use/focus
topic: Interaction
desc:
  Imperatively step focus backward through focusable elements, with
  wrap-around.
---

# focusPrevious

`focusPrevious(list?)` moves focus to the previous tabbable element
before the currently active one, skipping disabled elements and
wrapping back to the end when it reaches the start — the counterpart
to [`focusNext`](/use/focus/focusNext). Called with no arguments it
scans the whole document; pass an explicit array to scope the cycle to
a subset. Part of [`pota/use/focus`](/use/focus).

## Arguments

| Argument | Type            | Description                                                                                           |
| -------- | --------------- | ----------------------------------------------------------------------------------------------------- |
| `list`   | `HTMLElement[]` | Optional ordered set of candidates. Defaults to every tabbable element in the document, in DOM order. |

The default candidate set is `input` (non-hidden), `button`, `select`,
`textarea`, `a`, `[tabindex]`, and `[contenteditable]` elements. The
list is traversed in reverse, so wrap-around lands on the last
element — note that an explicit `list` you pass is reversed in place.

## Examples

### Step focus back on a key

A document-wide "previous field" action wired to a button, mirroring
<kbd>Shift</kbd>+<kbd>Tab</kbd> with wrap-around.

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
