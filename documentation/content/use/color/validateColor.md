---
title: validateColor
subpath: pota/use/color
topic: Utilities
desc: Returns the string if it parses as a color, else undefined.
---

# validateColor

`validateColor(string)` returns the original string if it parses as a
color, otherwise `undefined`. It swallows the parse error, so it never
throws — handy for guarding user input before passing it on.

## Arguments

| Name     | Type     | Description               |
| -------- | -------- | ------------------------- |
| `string` | `string` | The color string to test. |

**Returns:** `string | undefined` — the original string when it parses
as a valid color, otherwise `undefined`.

## Examples

### Guarding user input

Filters a raw input value to a valid color before applying it, falling
back to a default when the string can't be parsed.

```jsx
import { render, signal } from 'pota'
import { validateColor } from 'pota/use/color'

function App() {
	const input = signal('#3366ff')

	const color = () => validateColor(input.read()) ?? 'transparent'

	return (
		<div>
			<input
				value={input.read()}
				on:input={e => input.write(e.currentTarget.value)}
			/>
			<div
				style={{
					'background-color': color,
					width: '4rem',
					height: '4rem',
				}}
			/>
		</div>
	)
}

render(App)
```
