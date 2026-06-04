---
title: setProperty
subpath: pota
topic: Props
desc:
  Imperatively assign a DOM property on an element, unwrapping
  reactive accessors.
---

# setProperty

Imperatively assign a DOM property on an element, unwrapping reactive
accessors. Assigning `null` or `undefined` sets the property to
`null`. The declarative form is `prop:__`; for HTML attributes
specifically see [setAttribute](/setAttribute).

Use `setProperty` (or the `prop:` namespace in JSX) whenever the DOM
property and the HTML attribute diverge — `value` on inputs after user
edits, `checked` state, `srcObject` on a `video`, or custom properties
on a custom element.

## Arguments

| name    | type                       | description                                                                                           |
| ------- | -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `node`  | `Element`                  | Target element.                                                                                       |
| `name`  | `string`                   | Property name on the DOM node.                                                                        |
| `value` | `unknown \| () => unknown` | Value to assign; functions are unwrapped reactively. `null` / `undefined` set the property to `null`. |

**Returns:** `void`

## Examples

### Sync a slider's valueAsNumber

`valueAsNumber` exists only as a property (there is no equivalent
attribute), so it is driven from a signal — pressing _min_/_max_ snaps
the slider instantly.

```jsx
import { ref, render, setProperty, signal } from 'pota'

function App() {
	const slider = ref()
	const value = signal(50)

	return (
		<div>
			<input
				use:ref={slider}
				type="range"
				min="0"
				max="100"
			/>
			{() => setProperty(slider(), 'valueAsNumber', value.read())}
			<button on:click={() => value.write(0)}>min</button>
			<button on:click={() => value.write(100)}>max</button>
		</div>
	)
}

render(App)
```

### Setting a property from a ref

Assigns a reactive property once the element is captured, here from
inside an [effect](/effect).

```jsx
import { effect, ref, render, setProperty } from 'pota'

function App() {
	const element = ref()

	effect(() => {
		if (element()) {
			setProperty(element(), 'src', () => '/favicon.ico')
		}
	})

	return <img use:ref={element} />
}

render(App)
```
