---
title: useSelector
subpath: pota/use/selector
topic: Reactive helpers
desc:
  Builds isSelected(value) from a source signal — single shared
  effect.
---

# useSelector

`useSelector(source)` builds a signal generator from a source signal.
The returned `isSelected(value)` yields a read-only signal that is
`true` while the source currently matches that value. It uses a single
effect for every value — not one effect per value — so when the
selection changes, only the previously- and newly-selected rows
re-run, scaling to long lists checking against one selection. Part of
[`pota/use/selector`](/use/selector).

`source` is a [signal](/signal) reader. Its value can be a single item
(matched directly), `undefined` (nothing selected), or any object
exposing a `values()` method — `Set`, `Map`, or similar — whose values
become the selected set. That makes multi-selection a matter of
pointing `useSelector` at a signal holding a `Set`.

## Arguments

| Argument | Type                      | Description                                         |
| -------- | ------------------------- | --------------------------------------------------- |
| `source` | `SignalAccessor<unknown>` | Reader of the signal holding the current selection. |

**Returns:** `isSelected(item)` — call it with any value to get a
read-only [signal](/signal) reader that is `true` while `item` is part
of the current selection. Each reader is shared and reference-counted,
so calling `isSelected(item)` from many rows is cheap.

## Examples

### Per-row selection state

A single-selection list: clicking a row makes it the current value,
and `isSelected` toggles the `selected` class on exactly the row that
changed.

```jsx
import { useSelector } from 'pota/use/selector'
import { For } from 'pota/components'
import { render, signal } from 'pota'
import { css } from 'pota/use/css'

const items = ['apple', 'banana', 'cherry', 'date']

function App() {
	const current = signal('apple')
	const isSelected = useSelector(current.read)

	return (
		<>
			{css`
				.selected {
					color: aqua;
				}
			`}
			<ul>
				<For each={items}>
					{item => (
						<li
							class:selected={isSelected(item)}
							on:click={() => current.write(item)}
						>
							{item}
						</li>
					)}
				</For>
			</ul>
		</>
	)
}

render(App)
```

### Multi-selection with a Set

Point `useSelector` at a signal holding a `Set` and every member of
the set is treated as selected. Clicking a row toggles its membership;
`equals: false` forces the signal to notify on every in-place
mutation.

```jsx
import { render, signal } from 'pota'
import { useSelector } from 'pota/use/selector'
import { For } from 'pota/components'
import { css } from 'pota/use/css'

function App() {
	const selected = signal(new Set([3]), { equals: false })
	const isSelected = useSelector(selected.read)

	const toggle = item =>
		selected.update(set => {
			set.has(item) ? set.delete(item) : set.add(item)
			return set
		})

	return (
		<>
			{css`
				.selected {
					color: aqua;
				}
			`}

			<ul>
				<For each={[1, 2, 3, 4, 5]}>
					{item => (
						<li
							class:selected={isSelected(item)}
							on:click={() => toggle(item)}
						>
							item {item}
						</li>
					)}
				</For>
			</ul>
		</>
	)
}

render(App)
```
