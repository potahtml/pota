---
title: selectOnFocus
subpath: pota/use/focus
topic: Interaction
desc: use:ref function that selects the field's contents on focus.
---

# selectOnFocus

`selectOnFocus` selects the input / textarea contents whenever the
element gains focus — pairs well with
[`autoFocus`](/use/focus/autoFocus) for "click to edit" UI. Part of
[`pota/use/focus`](/use/focus).

## Examples

### Select-all on focus

Composes with [`autoFocus`](/use/focus/autoFocus): the field focuses
on mount and its contents are selected, ready to overtype.

```jsx
import { render } from 'pota'
import { autoFocus, selectOnFocus } from 'pota/use/focus'

function App() {
	return (
		<input
			value="select me on focus"
			use:ref={[autoFocus, selectOnFocus]}
		/>
	)
}

render(App)
```
