---
title: map
subpath: pota
topic: Reactive core
desc:
  Reactive array.map — reuses keyed rows across updates instead of
  rebuilding; powers For.
---

# map

Reactive equivalent of `array.map`. Runs the callback only for added,
removed or changed entries — existing rows keep their state instead of
being recreated on every change. Powers [`<For/>`](/components/For)
and works with arrays, Sets and Maps.

Plain `array.map(item => <li>{item}</li>)` can't react to mutations
without rebuilding every row from scratch, losing focus, DOM state,
and any work the row performed. `map` avoids that by keying rows by
identity and reusing them across updates.

## Arguments

| name             | type                           | description                                                |
| ---------------- | ------------------------------ | ---------------------------------------------------------- |
| `list`           | `iterable \| () => iterable`   | array, Set, Map, or a signal returning one of those        |
| `callback`       | `(item, index) => JSX.Element` | runs once per row; its return value is rendered            |
| `noSort?`        | `boolean`                      | when `true`, reordering the input does not reorder the DOM |
| `fallback?`      | `JSX.Element`                  | rendered when the input is empty                           |
| `reactiveIndex?` | `boolean`                      | when `true`, `index` is a signal accessor, not a number    |

**Returns:** a function the renderer calls to produce the rendered
rows.

## Notes

Pass the reader function (`items.read`) so the list stays reactive.
Rows are keyed by item identity, so reordering the input reuses each
row's existing DOM node — only their order changes. When
`reactiveIndex` is `true`, the second callback argument is a reader
function whose value updates as rows move.

## Examples

### Keyed iteration

Reuses every row's DOM node on reorder — only their order changes.

```jsx
import { map, render, signal } from 'pota'

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
				{map(items.read, item => (
					<li>{item}</li>
				))}
			</ul>
		</div>
	)
}

render(App)
```

### Mutating the list

Push and shift rows; only the affected rows are created or removed,
the rest keep their DOM.

```jsx
import { map, render, signal } from 'pota'

function App() {
	const items = signal([1, 2, 3])
	let next = 4

	return (
		<div>
			<button
				on:click={() => items.update(list => [...list, next++])}
			>
				push
			</button>
			<button on:click={() => items.update(list => list.slice(1))}>
				shift
			</button>
			<ul>
				{map(items.read, item => (
					<li>row {item}</li>
				))}
			</ul>
		</div>
	)
}

render(App)
```

### Reactive index and fallback

The `reactiveIndex` flag turns `index` into a reader that updates as
rows move; `fallback` renders when the list is empty.

```jsx
import { map, render, signal } from 'pota'

function App() {
	const items = signal(['a', 'b', 'c'])

	return (
		<ul>
			{map(
				items.read,
				(item, index) => (
					<li>
						{index} — {item}
					</li>
				),
				false,
				<li>nothing here</li>,
				true,
			)}
		</ul>
	)
}

render(App)
```

### Array, Set and Map

`map` accepts any iterable; Maps iterate over their values.

```jsx
import { map, render } from 'pota'

function App() {
	return (
		<div>
			<ul>
				{map([1, 2, 3], item => (
					<li>{item}</li>
				))}
			</ul>
			<ul>
				{map(new Set([4, 5, 6]), item => (
					<li>{item}</li>
				))}
			</ul>
			<ul>
				{map(new Map().set('a', 7).set('b', 8), item => (
					<li>{item}</li>
				))}
			</ul>
		</div>
	)
}

render(App)
```
