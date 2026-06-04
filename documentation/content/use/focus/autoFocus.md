---
title: autoFocus
subpath: pota/use/focus
topic: Interaction
desc: use:ref function that focuses the element after mount.
---

# autoFocus

`autoFocus` is a bare ref function: attach it via `use:ref` and it
focuses the element after mount — equivalent to writing
`node => onMount(() => node.focus())` yourself. Pairs well with
[`selectOnFocus`](/use/focus/selectOnFocus). Part of
[`pota/use/focus`](/use/focus).

## Examples

### Focus on mount

A click-to-edit field that focuses itself the moment it appears.

```jsx
import { render, signal } from 'pota'
import { Show } from 'pota/components'
import { autoFocus } from 'pota/use/focus'

function App() {
	const editing = signal(false)

	return (
		<Show
			when={editing.read}
			fallback={
				<button on:click={() => editing.write(true)}>edit</button>
			}
		>
			<input
				value="hello"
				use:ref={autoFocus}
				on:blur={() => editing.write(false)}
			/>
		</Show>
	)
}

render(App)
```
