---
title: Fragment
subpath: pota
topic: Renderer
desc: Groups sibling JSX children without inserting an extra DOM node.
---

# Fragment

`<>...</>` and `<Fragment>...</Fragment>` both group siblings without
inserting an extra DOM node. Use the explicit form when a tool (e.g.
an older lint rule) doesn't recognize the shorthand, or when you want
to pass `Fragment` programmatically.

`Fragment` simply returns its `children`, so it adds no wrapper
element and no overhead.

## Examples

### Grouping siblings

Returns two siblings from a component without a wrapping element, and
shows the shorthand `<>...</>` form at the top level.

```jsx
import { Fragment, render } from 'pota'

function Header() {
	return (
		<Fragment>
			<h1>title</h1>
			<p>subtitle</p>
		</Fragment>
	)
}

function App() {
	return (
		<>
			<Header />
			<main>body content</main>
		</>
	)
}

render(App)
```
