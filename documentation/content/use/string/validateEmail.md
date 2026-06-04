---
title: validateEmail
subpath: pota/use/string
topic: Utilities
desc: Return the normalized email when valid, otherwise false.
---

# validateEmail

`validateEmail(s)` normalizes `s` with
[`toString`](/use/string/toString) and lowercases it, then returns
that value when it looks like an email — at least 6 characters long
and matching `^[^@]+@[^@]+\.[^@]+$`. Anything else returns `false`.
The returned string is the cleaned value, so you can store it
directly.

The check is intentionally loose (one `@`, a dot in the domain); it is
a sanity filter, not full RFC validation. Part of
[`pota/use/string`](/use/string); see also
[`validatePassword`](/use/string/validatePassword).

## Arguments

| Argument | Type     | Description            |
| -------- | -------- | ---------------------- |
| `s`      | `string` | The email to validate. |

**Returns:** `string | false` — the lowercased, trimmed email when
valid, otherwise `false`.

## Examples

### Validate on submit

Reads the field, validates it, and either reports the error or uses
the normalized value.

```jsx
import { render, signal } from 'pota'
import { validateEmail } from 'pota/use/string'

function App() {
	const raw = signal('')
	const error = signal('')

	function submit(e) {
		e.preventDefault()
		const email = validateEmail(raw.read())
		if (email === false) {
			error.write('Please enter a valid email')
		} else {
			error.write('')
			console.log('normalized:', email) // e.g. 'A@B.UY' -> 'a@b.uy'
		}
	}

	return (
		<form on:submit={submit}>
			<input
				prop:value={raw.read}
				on:input={e => raw.write(e.currentTarget.value)}
			/>
			<button>Submit</button>
			<p>{error.read}</p>
		</form>
	)
}

render(App)
```
