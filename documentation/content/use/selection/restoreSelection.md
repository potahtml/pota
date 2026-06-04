---
title: restoreSelection
subpath: pota/use/selection
topic: Interaction
desc: Reapply a previously captured selection Range to the document.
---

# restoreSelection

`restoreSelection(range)` reapplies a previously captured DOM `Range`
to the window selection — the counterpart to
[`getSelection`](/use/selection/getSelection). It clears the existing
ranges and adds the saved one; passing `null` or `undefined` is a
no-op. The pair is useful when you have to mutate text that the user
is in the middle of editing without losing their cursor or highlight.
Part of [`pota/use/selection`](/use/selection).

## Arguments

| Argument | Type                         | Description                                 |
| -------- | ---------------------------- | ------------------------------------------- |
| `range`  | `Range \| null \| undefined` | The `Range` to restore; nullish is ignored. |

**Returns:** nothing.

## How it works

```js
const range = getSelection() // capture before mutating
// ... rewrite some text the user has selected ...
restoreSelection(range) // put the user's selection back
```

## Examples

### Round-trip a selection across a DOM mutation

Select part of the text, then press the button. The handler captures
the selection, rebuilds the paragraph's content, and restores the
selection so the highlight survives the mutation.

```jsx
import { render } from 'pota'
import { getSelection, restoreSelection } from 'pota/use/selection'

function App() {
	let para

	return (
		<div>
			<p use:ref={el => (para = el)}>
				Select a few of these words before pressing the button.
			</p>
			<button
				on:click={() => {
					const saved = getSelection()
					// mutate the DOM the user is selecting inside
					para.append(' (touched)')
					restoreSelection(saved)
				}}
			>
				mutate but keep selection
			</button>
		</div>
	)
}

render(App)
```
