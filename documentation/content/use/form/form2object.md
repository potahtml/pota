---
title: form2object
subpath: pota/use/form
topic: Forms
desc: Collect a form into a plain object via FormData.
---

# form2object

`form2object(form, object, submitter)` collects all fields via
`FormData`, merging same-name fields into an array, and returns a
plain object. The inverse is [`object2form`](/use/form/object2form).
Part of [`pota/use/form`](/use/form).

Pass an existing `object` to accumulate fields into it (it is mutated
and returned), so you can merge several forms into one snapshot. Pass
a `submitter` button to include its `name`/`value`, mirroring
`new FormData(form, submitter)`.

## Arguments

| Argument    | Type              | Description                                                                                           |
| ----------- | ----------------- | ----------------------------------------------------------------------------------------------------- |
| `form`      | `HTMLFormElement` | The form to read.                                                                                     |
| `object`    | `object`          | Optional target to merge into. Defaults to a fresh empty object. Mutated in place and returned.       |
| `submitter` | `HTMLElement`     | Optional submit button whose `name`/`value` are included, like the native `FormData` `submitter` arg. |

**Returns:** the populated `object` — same-name fields collapse into
an array of their values.

## Examples

### Round-trip a form

`form2object` reads the form on submit; `object2form` restores a
preset back into it.

```jsx
import { ref, render, signal } from 'pota'
import { form2object, object2form } from 'pota/use/form'

function App() {
	const formRef = ref()
	const snapshot = signal({})

	return (
		<div>
			<form
				use:ref={formRef}
				on:submit={e => {
					e.preventDefault()
					snapshot.write(form2object(e.currentTarget))
				}}
			>
				<p>
					<input
						name="title"
						value="hello"
					/>
				</p>
				<p>
					<label>
						<input
							type="checkbox"
							name="published"
							checked
						/>{' '}
						published
					</label>
				</p>
				<p>
					<label>
						<input
							type="radio"
							name="kind"
							value="article"
							checked
						/>{' '}
						article
					</label>
					<label style={{ 'margin-left': '1rem' }}>
						<input
							type="radio"
							name="kind"
							value="note"
						/>{' '}
						note
					</label>
				</p>
				<button>snapshot</button>
				<button
					type="button"
					on:click={() =>
						object2form(formRef(), {
							title: 'restored',
							published: false,
							kind: 'note',
						})
					}
				>
					restore preset
				</button>
			</form>

			<pre>{() => JSON.stringify(snapshot.read(), null, 2)}</pre>
		</div>
	)
}

render(App)
```

### Merge several forms into one object

Passing the same target `object` to repeated calls accumulates fields
across forms, since `form2object` mutates and returns what you give
it.

```jsx
import { ref, render, signal } from 'pota'
import { form2object } from 'pota/use/form'

function App() {
	const profile = ref()
	const prefs = ref()
	const merged = signal({})

	return (
		<div>
			<form use:ref={profile}>
				<input
					name="name"
					value="Ada"
				/>
				<input
					name="email"
					value="ada@example.com"
				/>
			</form>
			<form use:ref={prefs}>
				<input
					name="theme"
					value="dark"
				/>
				<input
					name="newsletter"
					value="weekly"
				/>
			</form>
			<button
				on:click={() => {
					const object = {}
					form2object(profile(), object)
					form2object(prefs(), object)
					merged.write(object)
				}}
			>
				merge
			</button>

			<pre>{() => JSON.stringify(merged.read(), null, 2)}</pre>
		</div>
	)
}

render(App)
```
