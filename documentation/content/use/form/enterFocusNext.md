---
title: enterFocusNext
subpath: pota/use/form
topic: Forms
desc: Ref — pressing Enter advances focus to the next form element.
---

# enterFocusNext

`enterFocusNext` is a `use:ref` function: pressing `Enter` moves focus
to the next form element. The forms version of "Enter to submit" when
you actually want "Enter to advance." Built on
[`focusNextInput`](/use/form/focusNextInput). Part of
[`pota/use/form`](/use/form).

## Arguments

`enterFocusNext` is a bare ref function — attach it directly, do not
call it.

| Argument | Type               | Description                   |
| -------- | ------------------ | ----------------------------- |
| `node`   | `HTMLInputElement` | The input wired by `use:ref`. |

## Examples

### Enter advances, and a swallowed Enter

Fields advance focus on `Enter`; another swallows `Enter` entirely
with [`preventEnter`](/use/form/preventEnter), and a textarea grows to
fit with [`sizeToInput`](/use/form/sizeToInput).

```jsx
import { render } from 'pota'
import {
	enterFocusNext,
	preventEnter,
	sizeToInput,
} from 'pota/use/form'

function App() {
	return (
		<form on:submit={e => e.preventDefault()}>
			<input
				placeholder="Enter advances to next field"
				use:ref={enterFocusNext}
			/>
			<input
				placeholder="Enter advances here too"
				use:ref={enterFocusNext}
			/>
			<input
				placeholder="Enter is swallowed (preventEnter)"
				use:ref={preventEnter}
			/>
			<textarea
				placeholder="grows with content"
				use:ref={sizeToInput}
			/>
		</form>
	)
}

render(App)
```
