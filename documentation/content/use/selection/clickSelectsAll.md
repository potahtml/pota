---
title: clickSelectsAll
subpath: pota/use/selection
topic: Interaction
desc: use:ref function that selects an element's text on click.
---

# clickSelectsAll

`clickSelectsAll` is a ref function from
[`pota/use/selection`](/use/selection): clicking the element selects
all of its children via the window selection. Attach it on any element
you want users to be able to select-then-copy with one click — text
inside descendants is included.

It is a plain ref function, not a factory, so pass it directly without
calling it: `use:ref={clickSelectsAll}`.

## Arguments

`clickSelectsAll` takes no options — it is the ref function itself.

| Argument | Type      | Description                                  |
| -------- | --------- | -------------------------------------------- |
| `node`   | `Element` | The element wired up; supplied by `use:ref`. |

**Returns:** nothing; wires a `click` listener that calls
`getSelection().selectAllChildren(node)`.

## Examples

### Select a code snippet on click

Click either snippet to select all of its text in one click, then copy
it.

```jsx
import { render } from 'pota'
import { clickSelectsAll } from 'pota/use/selection'

function App() {
	return (
		<div>
			<p>click any snippet to select it all (then ⌘/Ctrl+C):</p>
			<code
				use:ref={clickSelectsAll}
				style={{
					display: 'block',
					padding: '0.5rem',
					background: '#f4f4f4',
				}}
			>
				npm install pota
			</code>
			<code
				use:ref={clickSelectsAll}
				style={{
					display: 'block',
					padding: '0.5rem',
					background: '#f4f4f4',
					'margin-top': '0.5rem',
				}}
			>
				git clone https://github.com/potahtml/pota.git
			</code>
		</div>
	)
}

render(App)
```
