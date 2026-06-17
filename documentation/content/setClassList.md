---
title: setClassList
subpath: pota
topic: Props
desc:
  Imperatively add or remove several classes on an element, unwrapping
  reactive values.
---

# setClassList

Imperatively add or remove several classes on an element at once. It
is the multi-class companion to [setClass](/setClass): pass a string,
an array of names, or a `{ name: truthy }` object. Reactive accessors
are tracked — both the whole value and individual object entries may
be functions, and the corresponding classes follow them.

## Arguments

| name    | type                                                              | description                                                                                                                                                              |
| ------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `node`  | `Element`                                                         | Target element.                                                                                                                                                          |
| `value` | `string \| ArrayLike<string> \| { [name]: boolean } \| () => ...` | A string adds its space-separated names; arrays add their (truthy) names; object entries are added when truthy and removed when falsy; functions are tracked reactively. |

**Returns:** `void`

## Examples

### Many classes at once

Toggles two classes from independent signals by reading them inside a
reactive child; each object entry is applied as its signal changes.

```jsx
import { ref, render, setClassList, signal } from 'pota'

function App() {
	const box = ref()
	const open = signal(false)
	const error = signal(false)

	return (
		<div>
			<div
				use:ref={box}
				class="panel"
			>
				panel
			</div>
			<button on:click={() => open.update(o => !o)}>
				toggle open
			</button>
			<button on:click={() => error.update(e => !e)}>
				toggle error
			</button>
			{() =>
				setClassList(box(), {
					open: open.read(),
					error: error.read(),
				})
			}
		</div>
	)
}

render(App)
```
