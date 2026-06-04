---
title: Normalize
kind: component
subpath: pota/components
topic: Text
desc:
  Resolves children as text, joining them into one text node inside a
  single effect.
---

# `<Normalize/>`

Resolves children as text. It unwraps all descendants and joins them
into a single string, producing _one_ text node inside a _single_
effect — rather than one effect (and potentially one text node) per
child. When the joined result is empty it renders `null`, avoiding an
empty text node.

## When to use

Use it when rendering purely textual content made of multiple reactive
values side by side. A single effect updates the whole string when any
dependency changes, which reduces the number of DOM nodes and the
amount of reactive bookkeeping.

If the children are a mix of text and elements, use a regular fragment
instead — `Normalize` turns everything into a string.

## Examples

### Static and reactive text

Mixes a static greeting with two reactive values; both updates run
through the same effect and land in the one text node.

```jsx
import { render, signal } from 'pota'
import { Normalize } from 'pota/components'

const name = signal('world')
const n = signal(3)

render(
	<>
		<p>
			<Normalize>
				hello {name.read}, you have {n.read} messages
			</Normalize>
		</p>
		<button on:click={() => n.update(x => x + 1)}>+1 message</button>
		<button
			on:click={() =>
				name.update(x => (x === 'world' ? 'pota' : 'world'))
			}
		>
			toggle name
		</button>
	</>,
)
```

### Coalesced text

Two reactive inputs and a static greeting collapse into one text node
— typing in either input updates the whole string in a single effect
run.

```jsx
import { render, signal } from 'pota'
import { Normalize } from 'pota/components'

function App() {
	const first = signal('Ada')
	const last = signal('Lovelace')

	return (
		<div>
			<input
				prop:value={first.read}
				on:input={e => first.write(e.currentTarget.value)}
			/>
			<input
				prop:value={last.read}
				on:input={e => last.write(e.currentTarget.value)}
			/>
			<p>
				<Normalize>
					hello, {first.read} {last.read}!
				</Normalize>
			</p>
		</div>
	)
}

render(App)
```
