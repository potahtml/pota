---
title: copyToClipboard
subpath: pota/use/string
topic: Utilities
desc: Write text to the clipboard, swallowing errors.
---

# copyToClipboard

`copyToClipboard(s)` calls `navigator.clipboard.writeText` and
swallows errors. Part of [`pota/use/string`](/use/string).

## Arguments

| Argument | Type     | Description        |
| -------- | -------- | ------------------ |
| `s`      | `string` | The text to write. |

**Returns:** `Promise<void>` that always resolves — write errors are
caught and ignored.

## Examples

### Copy button

A button that copies fixed text to the clipboard. `copyToClipboard`
returns a promise that resolves once the write completes, so you can
flip a "copied" flag when it settles.

```jsx
import { render, signal } from 'pota'
import { copyToClipboard } from 'pota/use/string'

function App() {
	const copied = signal(false)

	const copy = async () => {
		await copyToClipboard('hello from pota')
		copied.write(true)
	}

	return (
		<button on:click={copy}>
			{() => (copied.read() ? 'Copied!' : 'Copy')}
		</button>
	)
}

render(App)
```
