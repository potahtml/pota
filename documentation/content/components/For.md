---
title: For
kind: component
subpath: pota/components
topic: Flow
desc:
  Keyed reactive array.map — renders one child per item, reusing and
  reordering DOM nodes.
---

# `<For/>`

Keyed, reactive version of `array.map`. Renders one child per item,
keying by item identity: when the array is reordered the matching DOM
nodes move rather than being recreated, and when an item keeps the
same reference its node (and any state inside it) is reused. Pass the
_reader_ (`items.read`, or a function returning an iterable) to keep
the list reactive.

## Attributes

| name             | type                           | description                                                                                                                      |
| ---------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `each`           | `Each<T>`                      | an iterable, or a signal/function whose value is iterable                                                                        |
| `children`       | `(item, index) => JSX.Element` | callback rendering one item; `index` is a number, or a `() => number` accessor when `reactiveIndex` is set                       |
| `restoreFocus?`  | `boolean`                      | when items are reordered, the DOM swap can steal focus and scroll position. Set `true` to save and restore both around the swap. |
| `fallback?`      | `JSX.Element`                  | rendered when the list is empty                                                                                                  |
| `reactiveIndex?` | `boolean`                      | when `true`, the callback's `index` is a reactive `() => number` accessor instead of a plain number                              |

## Examples

### Keyed list

Reversing the array moves the existing `<li>` nodes instead of
recreating them, because each item keeps the same string reference.

```jsx
import { render, signal } from 'pota'
import { For } from 'pota/components'

function App() {
	const items = signal(['apple', 'banana', 'cherry'])

	return (
		<div>
			<button
				on:click={() => items.update(list => [...list].reverse())}
			>
				reverse
			</button>
			<ul>
				<For each={items.read}>{item => <li>{item}</li>}</For>
			</ul>
		</div>
	)
}

render(App)
```

### Reactive index and fallback

With `reactiveIndex`, the callback's second argument is a signal
accessor (`() => number`) rather than a plain number — so each row
tracks its own current position as neighbors are added or removed.
`fallback` renders while the list is empty.

```jsx
import { render, signal } from 'pota'
import { For } from 'pota/components'

function App() {
	const items = signal([])

	return (
		<div>
			<button
				on:click={() =>
					items.update(list => [...list, `item ${list.length + 1}`])
				}
			>
				add
			</button>
			<button on:click={() => items.update(list => list.slice(1))}>
				remove first
			</button>
			<ul>
				<For
					each={items.read}
					reactiveIndex
					fallback={<li>list is empty</li>}
				>
					{(item, index) => (
						<li>
							#{index} — {item}
						</li>
					)}
				</For>
			</ul>
		</div>
	)
}

render(App)
```

### Sortable list with editable rows

Swapping two items moves their existing DOM nodes, so state inside a
row (here the input's focus and caret) survives the reorder.
`restoreFocus` returns focus to the moved element after the swap, and
storing the array as a [mutable](/store/store) makes per-field edits
(`item.text = …`) reactive.

```jsx
import { render } from 'pota'
import { For } from 'pota/components'
import { mutable } from 'pota/store'

const items = mutable([
	{ id: 'a', text: 'apple' },
	{ id: 'b', text: 'banana' },
	{ id: 'c', text: 'cherry' },
])

function swap(i, j) {
	const tmp = items[i]
	items[i] = items[j]
	items[j] = tmp
}

function App() {
	return (
		<ul>
			<For
				each={() => items}
				restoreFocus
				reactiveIndex
			>
				{(item, i) => (
					<li>
						<input
							prop:value={() => item.text}
							on:input={e => (item.text = e.currentTarget.value)}
						/>
						<button on:click={() => i() > 0 && swap(i(), i() - 1)}>
							↑
						</button>
						<button
							on:click={() =>
								i() < items.length - 1 && swap(i(), i() + 1)
							}
						>
							↓
						</button>
					</li>
				)}
			</For>
		</ul>
	)
}

render(App)
```

### Nested lists

`<For/>` nests: the inner list reads the same `rows` signal, so adding
a column updates every row reactively while keying preserves the cells
that didn't change.

```jsx
import { render, signal } from 'pota'
import { For } from 'pota/components'

function App() {
	const rows = signal([
		['a1', 'a2'],
		['b1', 'b2'],
	])

	return (
		<div>
			<button
				on:click={() =>
					rows.update(rs => rs.map((r, i) => [...r, `+${i}`]))
				}
			>
				add a column
			</button>
			<table>
				<tbody>
					<For each={rows.read}>
						{row => (
							<tr>
								<For each={() => row}>{cell => <td>{cell}</td>}</For>
							</tr>
						)}
					</For>
				</tbody>
			</table>
		</div>
	)
}

render(App)
```

### Empty list fallback

When `each` yields no items, the `fallback` is rendered in place of
the list. Here it is a static array, but `fallback` works the same way
with a reactive `each` that drains to empty.

```jsx
import { render } from 'pota'
import { For } from 'pota/components'

function App() {
	return (
		<For
			each={[]}
			fallback="List contains no items."
		>
			{item => <div>{item}</div>}
		</For>
	)
}

render(App)
```
