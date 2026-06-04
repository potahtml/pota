---
title: isDisabled
subpath: pota/use/form
topic: Forms
desc:
  True when an element is :disabled, directly or via an ancestor
  fieldset.
---

# isDisabled

`isDisabled(node)` returns `true` for elements that are `:disabled` —
directly or via an ancestor `<fieldset disabled>`. It is a thin
wrapper over `node.matches(':disabled')`, so it catches both
explicitly disabled controls and ones disabled through a containing
fieldset. Part of [`pota/use/form`](/use/form).

## Arguments

| Argument | Type      | Description           |
| -------- | --------- | --------------------- |
| `node`   | `Element` | The element to check. |

**Returns:** `boolean` — `true` when the element matches `:disabled`.

## Examples

### Inherit disabled from a fieldset

Toggling the `<fieldset disabled>` flips the result for the inner
input even though the input itself is never marked disabled.

```jsx
import { ref, render, signal } from 'pota'
import { isDisabled } from 'pota/use/form'

function App() {
	const inputRef = ref()
	const off = signal(true)
	const status = signal('')

	return (
		<form>
			<fieldset disabled={off.read}>
				<input
					use:ref={inputRef}
					name="title"
					value="hello"
				/>
			</fieldset>
			<button
				type="button"
				on:click={() => off.update(prev => !prev)}
			>
				toggle fieldset
			</button>
			<button
				type="button"
				on:click={() =>
					status.write(
						isDisabled(inputRef()) ? 'disabled' : 'enabled',
					)
				}
			>
				check
			</button>
			<p>{status.read}</p>
		</form>
	)
}

render(App)
```
