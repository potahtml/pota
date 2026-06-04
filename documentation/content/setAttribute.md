---
title: setAttribute
subpath: pota
topic: Props
desc:
  Imperatively set an attribute on an element, unwrapping reactive
  accessors and removing it on falsy values.
---

# setAttribute

Imperatively set an attribute on an element, unwrapping reactive
accessors and removing the attribute when the value is `false`, `null`
or `undefined`. The declarative form is the normal JSX attribute; for
DOM properties specifically see [setProperty](/setProperty).

In JSX, prefer writing attributes directly — `<div id={id}/>` already
flows through `setAttribute`. Reach for the function when you are
working outside JSX: building elements via `document.createElement`,
driving a [ref](/ref) from an effect, or bridging a third-party
library.

## Arguments

| name    | type                                       | description                                                                                                                            |
| ------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `node`  | `Element`                                  | Target element.                                                                                                                        |
| `name`  | `string`                                   | Attribute name (case sensitive).                                                                                                       |
| `value` | `string \| number \| boolean \| () => ...` | A function is tracked as a reactive accessor; `true` sets the attribute to the empty string; `false` / `null` / `undefined` remove it. |

**Returns:** `void`

## Examples

### Reactive aria-busy on a ref

Drives an attribute from a signal, passing the reader so the attribute
follows the signal; writing `null` removes it.

```jsx
import { ref, render, setAttribute, signal } from 'pota'

function App() {
	const button = ref()
	const busy = signal(false)

	return (
		<div>
			<button
				use:ref={button}
				on:click={() => busy.update(b => !b)}
			>
				toggle
			</button>
			{() =>
				setAttribute(
					button(),
					'aria-busy',
					busy.read() ? 'true' : null,
				)
			}
		</div>
	)
}

render(App)
```

### Setting an attribute from a ref

Assigns a static attribute once the element is captured, here from
inside an [effect](/effect).

```jsx
import { effect, ref, render, setAttribute } from 'pota'

function App() {
	const element = ref()

	effect(() => {
		if (element()) {
			setAttribute(element(), 'src', '/favicon.ico')
		}
	})

	return <img use:ref={element} />
}

render(App)
```
