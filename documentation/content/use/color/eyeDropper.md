---
title: eyeDropper
subpath: pota/use/color
topic: Utilities
desc: Pick an sRGB color with the browser EyeDropper API.
---

# eyeDropper

`eyeDropper(cb)` opens the browser
[EyeDropper](https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper)
API and calls `cb(hex)` with the picked sRGB hex string. When the
browser doesn't support the API it logs an error and returns instead
of calling back. User-cancel rejections are swallowed, so the callback
never fires on cancel.

## Arguments

| Name | Type                    | Description                                          |
| ---- | ----------------------- | ---------------------------------------------------- |
| `cb` | `(hex: string) => void` | Invoked with the picked color as an sRGB hex string. |

**Returns:** `Promise<void> | void` — a promise while picking, or
`void` (after logging an error) when the browser lacks support.

## Examples

### Pick a color into a signal

Opens the eyedropper on click and stores the picked color in a signal,
using it to tint a swatch.

```jsx
import { render, signal } from 'pota'
import { eyeDropper } from 'pota/use/color'

function App() {
	const color = signal('#3366ff')

	return (
		<div>
			<button on:click={() => eyeDropper(color.write)}>
				Pick a color
			</button>
			<div
				style={{
					'background-color': color.read,
					width: '4rem',
					height: '4rem',
				}}
			/>
		</div>
	)
}

render(App)
```
