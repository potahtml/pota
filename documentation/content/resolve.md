---
title: resolve
subpath: pota
topic: Reactive core
desc:
  Runs the functions inside props.children and returns a memo of the
  recursively-unwrapped result.
---

# resolve

Runs the functions inside `props.children` and returns a [memo](/memo)
of the recursively-unwrapped result. The unwrapping happens inside a
memo, so each function runs at most once per change.

`props.children` is typically an array of functions, components and
plain data. It is _not_ HTML; the elements are created when children
are returned — either by handing `props.children` back as-is or by
returning a new tree that references them.

Unlike Solid, `props.children` is not a getter. You don't need
`resolve` to consume children — reach for it when you need to run the
functions inside (to inspect them, or to avoid re-running them on
every read). Accessing or modifying `props.children` directly as many
times as you want has no cost.

`resolve` creates a memo owned by the caller, so anything it reads
becomes a dependency of that memo — not of the surrounding effect.
That matters when the caller is itself an effect and you want the
resolve to be the tracking boundary.

## Arguments

| name | type             | description                                           |
| ---- | ---------------- | ----------------------------------------------------- |
| `fn` | `T \| (() => T)` | the children to resolve, or a function returning them |

**Returns:** a read-only memo (`SignalAccessor`) of the recursively
unwrapped children.

## Examples

### Return children unchanged

The simplest use — run the children function and hand the result
straight back. Equivalent to consuming `props.children` directly, but
the work happens once inside the memo.

```jsx
import { render, resolve } from 'pota'

function Menu(props) {
	const items = resolve(() => {
		return props.children
	})

	return items
}

function App() {
	return (
		<Menu>
			<li>quack</li>
			<li>duck</li>
		</Menu>
	)
}

render(App)
```

### Inspect resolved children

`resolve(children)` returns a memo that recursively unwraps function
children — useful when a wrapper component needs to look at its
children (count them, filter them, peek at their props) without
breaking reactivity. Reading `kids()` re-runs only when child output
actually changes.

```jsx
import { render, resolve } from 'pota'

function Card(props) {
	const kids = resolve(props.children)

	return (
		<div class="card">
			<header>{() => `(${kids().length} children)`}</header>
			<div>{kids}</div>
		</div>
	)
}

function App() {
	return (
		<Card>
			<p>one</p>
			<p>two</p>
		</Card>
	)
}

render(App)
```

### Children caching

Filter children without re-running them. The counter shows the
children resolve only when their output actually changes, not on every
keystroke in the filter — the memo caches the unwrapped result.

```jsx
import { render, resolve, signal } from 'pota'

function Menu(props) {
	const rendered = signal(0)

	const items = resolve(() => {
		rendered.update(rendered => rendered + 1)
		return props.children
	})

	const search = signal('')

	function filter(item) {
		if (!search.read()) return item

		const text = item.textContent

		return text.includes(search.read()) ? item : null
	}
	return (
		<nav>
			<label>
				Filter:
				<input
					type="text"
					on:input={e => search.write(e.currentTarget.value)}
				/>
			</label>
			<hr />
			<ul>{() => items().filter(filter)}</ul>
			<hr />
			Children rendered {rendered.read} time
		</nav>
	)
}

function App() {
	return (
		<Menu>
			<li>dog</li>
			<li>meaw</li>
			<li>quack</li>
			<li>duck</li>
		</Menu>
	)
}

render(App)
```
