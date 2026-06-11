---
title: memo
subpath: pota
topic: Reactive core
desc:
  Read-only signal whose value is the return of a function, recomputed
  when any signal it reads changes.
---

# memo

Read-only signal whose value is the return of `fn`, recomputed when
any signal it reads changes. Memos in pota are _lazy_: the function
doesn't run until the memo is read the first time. If it is never
read, it never runs.

Use `memo` to cache derived work and share it with multiple consumers
— they all see the same value without re-running `fn`.

## Arguments

| name       | type                                              | description                                                                                           |
| ---------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `fn`       | `() => T`                                         | function to memoise                                                                                   |
| `options?` | `{ equals?: false \| ((prev, next) => boolean) }` | `equals: false` notifies on every recomputation; a comparator lets you control when dependents re-run |

**Returns:** a read-only signal — call it to read the current value.

## Examples

### Derived value

`memo(fn)` returns an accessor — call it (`doubled()`) to read, or
pass the accessor itself (`{doubled}`) as a JSX child for a reactive
binding. The body re-runs only when something it read actually
changes, and only once per change even if multiple readers depend on
it.

```jsx
import { memo, render, signal } from 'pota'

function App() {
	const count = signal(2)
	const doubled = memo(() => count.read() * 2)

	return (
		<div>
			<p>n = {count.read}</p>
			<p>2n = {doubled}</p>
			<button on:click={() => count.update(n => n + 1)}>+</button>
		</div>
	)
}

render(App)
```

### Filtered list

A memo is the right tool for a derived array — the filter runs once
when `query` or `items` changes, and [`<For/>`](/components/For) reads
the resulting array. Without the memo, every `<For/>` and every other
reader would re-filter on every dependency read.

```jsx
import { memo, render, signal } from 'pota'
import { For } from 'pota/components'

function App() {
	const items = signal(['apple', 'banana', 'cherry', 'date'])
	const query = signal('')

	const matches = memo(() => {
		const q = query.read().toLowerCase()
		return items.read().filter(item => item.toLowerCase().includes(q))
	})

	return (
		<div>
			<input
				on:input={e => query.write(e.currentTarget.value)}
				placeholder="filter…"
			/>
			<ul>
				<For each={matches}>{item => <li>{item}</li>}</For>
			</ul>
		</div>
	)
}

render(App)
```

### Layered memos

Memos compose: a memo can read other memos, and each layer caches
independently. Toggling a todo changes `completed` and re-runs
`percent`, while `total` re-runs but keeps its value — a memo whose
recomputed value is unchanged doesn't re-run its dependents.

```jsx
import { memo, render, signal } from 'pota'
import { For } from 'pota/components'

function App() {
	const todos = signal([
		{ text: 'a', done: true },
		{ text: 'b', done: false },
		{ text: 'c', done: false },
	])

	const total = memo(() => todos.read().length)
	const done = memo(() => todos.read().filter(t => t.done))
	const completed = memo(() => done().length)
	const percent = memo(() =>
		total() === 0 ? 0 : Math.round((completed() / total()) * 100),
	)

	function toggle(i) {
		todos.update(list =>
			list.map((t, n) => (n === i ? { ...t, done: !t.done } : t)),
		)
	}

	return (
		<div>
			<p>
				{completed} / {total} done — {percent}%
			</p>
			<ul>
				<For each={todos.read}>
					{(todo, i) => (
						<li on:click={() => toggle(i)}>
							{todo.done ? '✓ ' : '○ '}
							{todo.text}
						</li>
					)}
				</For>
			</ul>
		</div>
	)
}

render(App)
```

### Lazy execution

An unread memo is a no-op — its function only runs once something
reads its value. Here the body doesn't run on declaration; it runs the
first time the button reveals `expensive`.

```jsx
import { memo, render, signal } from 'pota'
import { Show } from 'pota/components'

function App() {
	const show = signal(false)
	const log = signal('')

	const expensive = memo(() => {
		log.write('memo ran') // only runs once shown
		return 'computed on demand'
	})

	return (
		<div>
			<button on:click={() => show.write(true)}>reveal</button>
			<p>{log.read}</p>
			<Show when={show.read}>
				<p>{expensive}</p>
			</Show>
		</div>
	)
}

render(App)
```
