---
title: focusNextInput
subpath: pota/use/form
topic: Forms
desc:
  The focus stepper behind enterFocusNext, exported for custom key
  handlers.
---

# focusNextInput

`focusNextInput(node, event)` is the engine behind
[`enterFocusNext`](/use/form/enterFocusNext); exported so you can wire
your own key handlers. It finds `node` among its owning form's
`elements`, focuses the element after it, and — only when there is a
next element — calls `preventDefault` and `stopPropagation` on the
event. With no owning form or no next element it is a no-op. Part of
[`pota/use/form`](/use/form).

## Arguments

| Argument | Type      | Description                                                              |
| -------- | --------- | ------------------------------------------------------------------------ |
| `node`   | `Element` | A form control; focus moves to the element after it in the form.         |
| `event`  | `Event`   | The triggering event; `preventDefault`/`stopPropagation` run on advance. |

## Examples

### Wire your own key handler

`enterFocusNext` reacts to `Enter`; here `focusNextInput` is driven by
`ArrowDown` instead, advancing to the next field while leaving `Enter`
free to submit.

```jsx
import { addEvent, render } from 'pota'
import { focusNextInput } from 'pota/use/form'

const arrowAdvances = node =>
	addEvent(node, 'keydown', e => {
		if (e.code === 'ArrowDown') focusNextInput(node, e)
	})

function App() {
	return (
		<form on:submit={e => e.preventDefault()}>
			<input
				placeholder="ArrowDown advances"
				use:ref={arrowAdvances}
			/>
			<input
				placeholder="ArrowDown advances"
				use:ref={arrowAdvances}
			/>
			<input
				placeholder="last field"
				use:ref={arrowAdvances}
			/>
		</form>
	)
}

render(App)
```
