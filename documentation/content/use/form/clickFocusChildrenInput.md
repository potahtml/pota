---
title: clickFocusChildrenInput
subpath: pota/use/form
topic: Forms
desc:
  Ref — clicking the element focuses its first focusable descendant.
---

# clickFocusChildrenInput

`clickFocusChildrenInput` is a `use:ref` function: clicking the
element focuses the first focusable descendant (input / button /
select / textarea / contenteditable). Useful for clickable labels
around a hidden input. Part of [`pota/use/form`](/use/form).

## Arguments

`clickFocusChildrenInput` is a bare ref function — attach it directly,
do not call it.

| Argument | Type      | Description                     |
| -------- | --------- | ------------------------------- |
| `node`   | `Element` | The element wired by `use:ref`. |

The first focusable descendant is matched with
`input:not([type=hidden]), button, select, textarea, [contenteditable]`.

## Examples

### A clickable label

Clicking anywhere in the label — including the text — focuses the
descendant input.

```jsx
import { render } from 'pota'
import { clickFocusChildrenInput } from 'pota/use/form'

function App() {
	return (
		<label use:ref={clickFocusChildrenInput}>
			Click anywhere here
			<input placeholder="…and I get focus" />
		</label>
	)
}

render(App)
```
