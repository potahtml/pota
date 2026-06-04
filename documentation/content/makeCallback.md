---
title: makeCallback
subpath: pota
topic: Renderer
desc:
  Wraps children into a callable that re-evaluates them with the
  arguments you pass, untracking marked components.
---

# makeCallback

`makeCallback(children)` returns a function that yields the rendered
children — calling it again re-evaluates them with whatever arguments
you pass. It's the helper flow components like
[`<Show/>`](/components/Show), [`<Switch/>`](/components/Switch), and
[`<For/>`](/components/For) use to support children that are either
static JSX or render functions like `{(item, index) => …}`.

Marked components (those carrying the component tag, see
[markComponent](/markComponent)) run untracked, so signals read in
their body don't subscribe the caller; plain user callbacks stay
tracked.

## Arguments

| name       | type                           | description                                      |
| ---------- | ------------------------------ | ------------------------------------------------ |
| `children` | `JSX.Element \| JSX.Element[]` | the children to wrap (static JSX or a render fn) |

**Returns:** `(...args) => JSX.Element | JSX.Element[]` — call it to
render the children, forwarding `args` to any function children.

## Examples

### Re-evaluating children with arguments

Wraps a render-function child and calls it twice with different
arguments to produce two rendered outputs.

```jsx
import { makeCallback, render } from 'pota'

function HoverPanel(props) {
	const renderChildren = makeCallback(props.children)

	return (
		<div>
			{renderChildren('hovering')}
			{renderChildren('idle')}
		</div>
	)
}

function App() {
	return <HoverPanel>{state => <p>state is {state}</p>}</HoverPanel>
}

render(App)
```
