---
title: sizeToInput
subpath: pota/use/form
topic: Forms
desc: Ref — grow or shrink a textarea to fit its content.
---

# sizeToInput

`sizeToInput` is a `use:ref` function that makes a textarea grow and
shrink to fit its content on `input` and `focus`, expanding to its
parent's height when the parent is taller, then ungrowing back to the
content height on `blur`. Reach for it instead of a fixed-row textarea
when the box should track what the user types. Part of
[`pota/use/form`](/use/form).

## Arguments

`sizeToInput` is a bare ref function — attach it directly, do not call
it.

| Argument | Type                  | Description                      |
| -------- | --------------------- | -------------------------------- |
| `node`   | `HTMLTextAreaElement` | The textarea wired by `use:ref`. |

## Examples

### Auto-growing textarea

A textarea that resizes to fit its content as you type, with overflow
hidden so no scrollbar appears.

```jsx
import { render } from 'pota'
import { sizeToInput } from 'pota/use/form'

function App() {
	return (
		<textarea
			placeholder="grows with content"
			use:ref={sizeToInput}
		/>
	)
}

render(App)
```
