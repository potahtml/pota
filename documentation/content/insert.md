---
title: insert
subpath: pota
topic: Renderer
desc:
  Places children into a parent without creating a root, so they are
  owned by the surrounding scope.
---

# insert

Places children into a parent without creating a root, so they are
owned by the surrounding scope. It is the lower-level cousin of
[render](/render): same mounting, but it does **not** wrap the content
in a fresh [root](/root) and does **not** return a disposer.

Because it relies on the current reactive owner, call `insert` from
inside one — typically a component body or an existing `root`. Its
content disposes when that surrounding scope disposes. Use it to
project content into a different DOM location while keeping it tied to
the lifecycle of the place that created it.

Like `render`, inserting into a container does not clear the container
by default, and the inserted content removes only its own nodes on
disposal.

## Arguments

| name       | type                                      | description                                                                                          |
| ---------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `children` | `JSX.Element`                             | thing to insert                                                                                      |
| `parent?`  | `Element \| DocumentFragment \| null`     | mount point (default: `document.body`); a `ShadowRoot` is a `DocumentFragment`                       |
| `options?` | `{ clear?: boolean; relative?: boolean }` | `clear` empties the target before inserting; `relative` inserts before `parent` instead of appending |

**Returns:** the created node(s) — a `Node`, an array of `Node`s, or
`undefined`, depending on what `children` resolves to. Not a disposer.

## insert vs render

- [render](/render) creates a fresh root, mounts the content, and
  returns a dispose function. Call it to bootstrap an app or mount an
  independently-managed subtree.
- `insert` skips the root and returns the inserted node(s). Call it
  from inside an existing owner when the content should live and die
  with that owner.

## Examples

### Project content into another element

Insert from inside a component so the inserted content is owned by
that component — it disposes automatically when the component does.

```jsx
import { insert, render, signal } from 'pota'

const host = document.createElement('aside')
host.style.cssText = 'border:1px dashed #888; padding:.5rem'
document.body.append(host)

function App() {
	const message = signal('hello from outside')

	// owned by App's scope — its content disposes with App
	insert(<p>{message.read}</p>, host)

	return (
		<p>
			<button on:click={() => message.write('updated!')}>
				update sidebar
			</button>
		</p>
	)
}

render(App)
```

### Clear the target first

Pass `{ clear: true }` to empty the target element before inserting.

```jsx
import { insert, render } from 'pota'

function App() {
	return <main>original content</main>
}

render(App)

render(() => {
	insert(
		<span>replaced content</span>,
		document.querySelector('main'),
		{
			clear: true,
		},
	)
	return null
})
```
