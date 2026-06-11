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
select / textarea / contenteditable). Useful for making an arbitrary
container behave like a `<label>` — clicking anywhere inside focuses
the field. Part of [`pota/use/form`](/use/form).

## Arguments

`clickFocusChildrenInput` is a bare ref function — attach it directly,
do not call it.

| Argument | Type      | Description                     |
| -------- | --------- | ------------------------------- |
| `node`   | `Element` | The element wired by `use:ref`. |

The first focusable descendant is matched with
`input:not([type=hidden]), button, select, textarea, [contenteditable]`.

## Examples

### A label-like wrapper

Clicking anywhere in the wrapper — including the text — focuses the
descendant input, without needing a `<label>`.

```jsx
import { render } from 'pota'
import { clickFocusChildrenInput } from 'pota/use/form'

function App() {
	return (
		<div use:ref={clickFocusChildrenInput}>
			Click anywhere here
			<input placeholder="…and I get focus" />
		</div>
	)
}

render(App)
```
