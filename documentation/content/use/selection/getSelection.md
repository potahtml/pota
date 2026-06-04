---
title: getSelection
subpath: pota/use/selection
topic: Interaction
desc: Snapshot the current document selection as a Range, or null.
---

# getSelection

`getSelection()` snapshots the current document selection as a DOM
`Range`, or `null` when nothing is selected. It reads
`window.getSelection()` and returns its first range (`getRangeAt(0)`).
Pair it with [`restoreSelection`](/use/selection/restoreSelection)
when you have to mutate text the user is in the middle of editing.
Part of [`pota/use/selection`](/use/selection).

## Arguments

`getSelection()` takes no arguments.

**Returns:** the current `Range`, or `null` if nothing is selected.

## How it works

```js
const range = getSelection()
if (range) {
	// ... mutate the DOM ...
	restoreSelection(range) // put the user's selection back
}
```

## Examples

### Read what the user selected

Select any text on the page, then click the button to capture the
current selection and show the selected string.

```jsx
import { render, signal } from 'pota'
import { getSelection } from 'pota/use/selection'

function App() {
	const text = signal('')

	return (
		<div>
			<p>Select some of this text, then press the button.</p>
			<button
				on:click={() => {
					const range = getSelection()
					text.write(range ? range.toString() : '(nothing selected)')
				}}
			>
				capture selection
			</button>
			<pre>{text.read}</pre>
		</div>
	)
}

render(App)
```
