---
title: setClass
subpath: pota
topic: Props
desc:
  Imperatively toggle a single class on an element, unwrapping
  reactive values.
---

# setClass

Imperatively toggle a single class on an element: a truthy `value`
adds the class, a falsy one removes it. The value may be a reactive
accessor, in which case the class follows it. The declarative form is
`class:myClass={…}`. To add or remove many classes at once see
[setClassList](/setClassList).

JSX's `class:myClass=` already flows through `setClass`. Use the
function when building nodes imperatively, in a [ref](/ref)-driven
effect, or driving a class from outside JSX.

## Arguments

| name    | type                       | description                                                                |
| ------- | -------------------------- | -------------------------------------------------------------------------- |
| `node`  | `Element`                  | Target element.                                                            |
| `name`  | `string`                   | Class name to toggle.                                                      |
| `value` | `boolean \| () => boolean` | Truthy adds the class, falsy removes it; functions are tracked reactively. |

**Returns:** `void`

## Examples

### Toggle a class from a signal

Passes the signal reader so the `selected` class follows the signal
automatically as the card is clicked.

```jsx
import { ref, render, setClass, signal } from 'pota'

function App() {
	const card = ref()
	const selected = signal(false)

	return (
		<div>
			<div
				use:ref={card}
				class="card"
				on:click={() => selected.update(s => !s)}
			>
				click me
			</div>
			{() => setClass(card(), 'selected', selected.read())}
		</div>
	)
}

render(App)
```

### Mark the active link

Toggles a class per element from inside the `use:connected` lifecycle
callback, deriving each link's active state from the current
[location](/use/location).

```jsx
import { render, setClass } from 'pota'
import { location } from 'pota/use/location'
import { A } from 'pota/components'
import { css } from 'pota/use/css'

function App() {
	return (
		<ul
			use:connected={menu => {
				for (const link of menu.querySelectorAll('a')) {
					setClass(
						link.parentElement,
						'selected',
						() => location.href() === link.href,
					)
				}
			}}
		>
			{css`
				.selected a {
					color: aqua;
				}
			`}
			<li>
				<A href="#one">one</A>
			</li>
			<li>
				<A href="#two">two</A>
			</li>
			<li>
				<A href="#three">three</A>
			</li>
		</ul>
	)
}

render(App)
```
