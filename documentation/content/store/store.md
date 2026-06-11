---
title: store
subpath: pota/store
topic: Store
desc:
  Reactive store with a dedicated batched setter — all writes flow
  through setStore for a single flush.
---

# store

A reactive store with a dedicated batched setter. `store(source)`
returns a `[store, setStore]` tuple: `store` is a
[mutable](/store/mutable) proxy typed as `DeepReadonly<T>`, so
TypeScript steers every mutation through the setter even though the
runtime would still accept a direct write. `setStore(fn)` runs
`fn(draft)` inside [batch](/batch) so any number of writes flush to
effects once, and inside [untrack](/untrack) so reads in the mutator
never subscribe the surrounding scope.

Reach for `store` when you want the ergonomics of mutating a plain
object but a single, explicit write path. For ad-hoc reactivity
without the setter, use [mutable](/store/mutable) directly.

## Arguments

| name     | type      | description                                                                         |
| -------- | --------- | ----------------------------------------------------------------------------------- |
| `source` | `T`       | object to wrap in a mutable proxy                                                   |
| `clone?` | `boolean` | when `true`, deep-copy `source` first so outside references can't bypass `setStore` |

**Returns:** a `[store, setStore]` tuple. `store` is the mutable proxy
(typed `DeepReadonly<T>`); `setStore(fn)` calls `fn(draft)` inside a
single batch + untrack.

## Examples

### Batched writes

Three writes inside one `setStore` call flush together — the effect
runs once with the final values.

```jsx
import { store } from 'pota/store'
import { effect, render, signal } from 'pota'

const [user, setUser] = store({
	name: 'ada',
	age: 0,
	role: 'engineer',
})

const log = signal('')

// runs once per batched `setUser` call, not once per write
effect(() => {
	log.write(`user is now ${user.name} ${user.age} ${user.role}`)
})

function App() {
	return (
		<div>
			<p>{log.read}</p>
			<button
				on:click={() =>
					setUser(u => {
						u.name = 'grace'
						u.age = 30
						u.role = 'rear admiral'
					})
				}
			>
				rename and promote (one effect run)
			</button>
		</div>
	)
}

render(App)
```

### Nested mutations

The proxy is deep, so the setter can drill into nested objects and
arrays directly. Move a card between columns or rename a column — both
mutations land in one batched flush.

```jsx
import { store } from 'pota/store'
import { For } from 'pota/components'
import { render } from 'pota'

const [board, setBoard] = store({
	title: 'sprint planning',
	columns: [
		{ name: 'todo', cards: ['one', 'two'] },
		{ name: 'doing', cards: [] },
		{ name: 'done', cards: ['shipped'] },
	],
})

function App() {
	function moveOne() {
		setBoard(b => {
			const card = b.columns[0].cards.shift()
			if (card) b.columns[1].cards.push(card)
		})
	}

	function rename(i, name) {
		setBoard(b => {
			b.columns[i].name = name
		})
	}

	return (
		<div>
			<h2>{() => board.title}</h2>
			<button on:click={moveOne}>todo → doing</button>
			<button on:click={() => rename(2, 'shipped')}>
				rename "done" → "shipped"
			</button>
			<For each={() => board.columns}>
				{col => (
					<section>
						<h3>{() => col.name}</h3>
						<ul>
							<For each={() => col.cards}>
								{card => <li>{card}</li>}
							</For>
						</ul>
					</section>
				)}
			</For>
		</div>
	)
}

render(App)
```
