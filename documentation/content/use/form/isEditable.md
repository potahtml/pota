---
title: isEditable
subpath: pota/use/form
topic: Forms
desc:
  True when the user is typing into an element
  (input/textarea/select/contenteditable).
---

# isEditable

`isEditable(node)` returns `true` for `<input>`, `<textarea>`,
`<select>`, and any element inside a `contenteditable` tree — the
canonical "is the user typing into this?" check that global keyboard
shortcuts can use to bail out. A `null` or `undefined` node returns
`false`. Part of [`pota/use/form`](/use/form).

## Arguments

| Argument | Type                           | Description           |
| -------- | ------------------------------ | --------------------- |
| `node`   | `Element \| null \| undefined` | The element to check. |

**Returns:** `boolean` — `true` when `node` is a user-editable
element.

## Examples

### Bail out of a global shortcut

Stand down from a window-level keyboard handler while the user is
typing into a field, so single-key shortcuts don't fire mid-word.

```jsx
import { render } from 'pota'
import { isEditable } from 'pota/use/form'

function App() {
	function onKeyDown(e) {
		// ignore shortcuts while typing into a field
		if (isEditable(document.activeElement)) return

		if (e.key === '/') {
			e.preventDefault()
			alert('search shortcut')
		}
	}

	return (
		<main
			on:keydown={onKeyDown}
			tabindex="0"
		>
			<p>Press "/" anywhere to search.</p>
			<input placeholder="typing here disables the shortcut" />
		</main>
	)
}

render(App)
```
