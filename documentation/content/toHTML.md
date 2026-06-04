---
title: toHTML
subpath: pota
topic: Renderer
desc:
  Evaluates any JSX value into concrete DOM nodes and returns them,
  without mounting anything.
---

# toHTML

Evaluates any JSX value into concrete DOM nodes and returns them,
without mounting anything. Reach for it when you need actual `Node`s
in hand — for third-party libraries that want a DOM reference, for
inserting into a `DocumentFragment`, or for custom rendering
pipelines.

Unlike [render](/render), `toHTML` does not create a root or attach
anything to the document — you decide where and how to attach the
returned nodes. Reactivity is preserved: signals inside the JSX keep
updating the produced nodes for as long as the surrounding owner is
alive.

## Arguments

| name       | type          | description                                                                     |
| ---------- | ------------- | ------------------------------------------------------------------------------- |
| `children` | `JSX.Element` | element, component, fragment, signal, array, promise — anything pota can render |

**Returns:** `ChildNode | NodeListOf<ChildNode>` — a single
`ChildNode` when the input resolves to one node, or a `NodeList` when
it resolves to several.

## Examples

### Materialize a reactive node

Evaluate JSX into a real `Node`, append it yourself, and watch the
signal keep updating it in place.

```jsx
import { toHTML, signal } from 'pota'

const label = signal('first')

const node = toHTML(<p>{label.read}</p>)
document.body.append(node)

// the existing <p> updates in place
setTimeout(() => label.write('second'), 1000)
```

### Pass children through a component

Materialize `props.children` into nodes so you can inspect or
rearrange them before placing them. Reactive children still update.

```jsx
import { render, signal, toHTML } from 'pota'

function Menu(props) {
	const children = toHTML(props.children)
	return <ul>{children}</ul>
}

function App() {
	const count = signal(0)
	return (
		<>
			<button on:click={() => count.update(n => n + 1)}>
				increment
			</button>
			<Menu>
				<li>uno</li>
				<li>dos</li>
				<li>tres</li>
				<li>{count.read}</li>
				<li>{2 * 2 + 1}</li>
			</Menu>
		</>
	)
}

render(App)
```
