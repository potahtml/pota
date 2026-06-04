---
title: bind
subpath: pota/use/bind
topic: Forms
desc:
  Two-way binding between a form field and a signal via the use:bind
  directive.
---

# bind

Two-way binding between a form field and a signal. The value is read
into the signal on `input`, and the element is updated when the signal
changes. Accepts a single signal or a flat array of signals (all bound
to the same element).

`bind(initial)` returns a `SignalFunction` — a callable signal where
`value()` reads and `value(next)` writes — so a single call covers
both the reactive cell and the `use:bind` directive value. `use:bind`
is the one intentional `propsPlugin` holdout; new `use/*` plugins
should ship as ref factories instead (see
[clickOutside](/use/clickoutside)).

## Arguments

| Name    | Type             | Description                                                                  |
| ------- | ---------------- | ---------------------------------------------------------------------------- |
| `value` | `T \| (() => T)` | Optional initial value; a function is treated as a computed (reactive) seed. |

**Returns:** a `SignalFunction<Accessed<T>>` — call with no argument
to read, call with a value to write.

## Supported elements

- `<input type="checkbox">` — binds to `checked`
- `<input type="radio">` — binds `checked` to `node.value == signal()`
  (loose `==`, so a number signal matches a string `value`); writes
  the radio's own `value` when selected
- any other `<input>`, `<textarea>`, `<select>` — binds to `value`
- `contenteditable` elements — binds to `innerText`, preserving the
  caret selection across updates

## Examples

### Text, select, checkbox, radio, and contenteditable

A field of each supported kind, each mirrored live next to its control
and driven from buttons that write the signal directly. Note the radio
signal is the number `2` while the markup has `value="2"`; the loose
`==` comparison still selects it.

```jsx
import { render } from 'pota'

import { bind } from 'pota/use/bind'

function App() {
	const input = bind('email@example.net')
	const select = bind('1')
	const checkbox = bind(true)
	const radio = bind(2)
	const contentEditable = bind('editable')

	return (
		<main>
			<section>
				<input
					name="email"
					use:bind={input}
				/>{' '}
				email: {input}
				<button on:click={() => input('email2@example.net')}>
					select email2@example.net
				</button>
			</section>
			<section>
				<select use:bind={select}>
					<option>0</option>
					<option>1</option>
					<option>2</option>
					<option>3</option>
				</select>
				select: {select}
				<button on:click={() => select('3')}>select three</button>
			</section>
			<section>
				<input
					type="checkbox"
					use:bind={checkbox}
				/>{' '}
				checkbox: {checkbox}
				<button on:click={() => checkbox(true)}>set checked</button>
			</section>
			<section>
				<label>
					<input
						type="radio"
						use:bind={radio}
						name="lala"
						value="1"
					/>{' '}
					one{' '}
				</label>{' '}
				<label>
					<input
						type="radio"
						use:bind={radio}
						name="lala"
						value="2"
					/>{' '}
					two{' '}
				</label>
				{' - '}
				radio: {radio}
				<button on:click={() => radio(2)}>set 2</button>
			</section>
			<section>
				<label>
					<span
						contenteditable="true"
						use:bind={contentEditable}
					></span>
				</label>
				{' - '}
				{contentEditable}
				{' - '}
				<button on:click={() => contentEditable('')}>clear</button>
			</section>
		</main>
	)
}

render(App)
```
