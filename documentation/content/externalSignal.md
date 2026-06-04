---
title: externalSignal
subpath: pota
topic: Reactive core
desc:
  Signal for arrays of objects with an id key whose write patches by
  id, reusing deep-equal entries by reference.
---

# externalSignal

A signal tailored for arrays of objects with an `id` key. Reads behave
like [signal](/signal), but `write(fresh)` patches the array by `id`:
items already present and deep-equal keep the same reference, only
changed or new items become new references.

It is a cheap way to merge polled or refreshed server data without
reaching for a full [store](/store/store) — downstream code that
compares by reference (`===`), such as a keyed
[`<For/>`](/components/For), sees a minimal diff.

## Arguments

| name           | type                          | description                                   |
| -------------- | ----------------------------- | --------------------------------------------- |
| `initialValue` | `Array<{ id?: string, ... }>` | seed array; entries should expose an `id` key |
| `options?`     | `SignalOptions`               | forwarded to the underlying `signal`          |

**Returns:** an object `{ read, update, write }`. `read` and `update`
match [signal](/signal); `write` patches the array by id rather than
replacing it wholesale.

## Examples

### Patch a list while preserving identity

Clicking _refresh_ writes a fresh array: `id 1` changes (toggled to
done) so it becomes a new reference, `id 2` stays deep-equal so the
old reference is reused, and `id 3` is new. The keyed `<For/>` only
touches the rows that actually changed.

```jsx
import { externalSignal, render } from 'pota'
import { For } from 'pota/components'

function App() {
	const todos = externalSignal([
		{ id: 1, text: 'buy milk', done: false },
		{ id: 2, text: 'walk dog', done: true },
	])

	function refresh() {
		todos.write([
			{ id: 1, text: 'buy milk', done: true },
			{ id: 2, text: 'walk dog', done: true },
			{ id: 3, text: 'water plants', done: false },
		])
	}

	return (
		<div>
			<button on:click={refresh}>refresh</button>
			<ul>
				<For each={todos.read}>
					{todo => (
						<li>
							{todo.text} — {todo.done ? '✓' : '…'}
						</li>
					)}
				</For>
			</ul>
		</div>
	)
}

render(App)
```
