---
title: preventEnter
subpath: pota/use/form
topic: Forms
desc: Ref — block Enter from inserting a newline or submitting.
---

# preventEnter

`preventEnter` is a `use:ref` function that blocks `Enter` from
inserting a newline or submitting a form; it calls `preventDefault`
and `stopPropagation` on `Enter` and `NumpadEnter` keydowns. Reach for
it on single-line-ish inputs or chat boxes where `Enter` should do
nothing on its own. Part of [`pota/use/form`](/use/form).

## Arguments

`preventEnter` is a bare ref function — attach it directly, do not
call it.

| Argument | Type         | Description                     |
| -------- | ------------ | ------------------------------- |
| `node`   | `DOMElement` | The element wired by `use:ref`. |

## Examples

### Swallow Enter

An input where pressing `Enter` does nothing — no newline, no submit.

```jsx
import { render } from 'pota'
import { preventEnter } from 'pota/use/form'

function App() {
	return (
		<form on:submit={e => e.preventDefault()}>
			<input
				placeholder="Enter does nothing"
				use:ref={preventEnter}
			/>
		</form>
	)
}

render(App)
```
