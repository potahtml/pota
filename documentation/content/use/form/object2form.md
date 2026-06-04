---
title: object2form
subpath: pota/use/form
topic: Forms
desc: Write a plain object's values back into a form.
---

# object2form

`object2form(form, object)` writes an object's values back into a
form's fields, matched by `name`. It handles text and number inputs,
checkboxes (boolean → `checked`), radios (selected by value match),
and multi-selects (each `<option>` whose value appears in the array is
selected). The inverse of [`form2object`](/use/form/form2object); see
its example for the full round-trip. Part of
[`pota/use/form`](/use/form).

## Arguments

| Argument | Type              | Description                                                   |
| -------- | ----------------- | ------------------------------------------------------------- |
| `form`   | `HTMLFormElement` | The form whose fields are populated.                          |
| `object` | `object`          | Values keyed by field `name`; each key fills matching fields. |

## Examples

### Restore a preset

Populate a form from a saved object — text, checkbox, and radio fields
all picked up by their `name`.

```jsx
import { render } from 'pota'
import { object2form } from 'pota/use/form'

function App() {
	let form

	const preset = {
		title: 'restored',
		published: true,
		kind: 'note',
	}

	return (
		<form use:ref={el => (form = el)}>
			<input name="title" />
			<label>
				<input
					type="checkbox"
					name="published"
				/>{' '}
				published
			</label>
			<label>
				<input
					type="radio"
					name="kind"
					value="note"
				/>{' '}
				note
			</label>
			<label>
				<input
					type="radio"
					name="kind"
					value="page"
				/>{' '}
				page
			</label>
			<button
				type="button"
				on:click={() => object2form(form, preset)}
			>
				restore preset
			</button>
		</form>
	)
}

render(App)
```
