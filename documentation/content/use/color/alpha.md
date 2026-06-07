---
title: alpha
subpath: pota/use/color
topic: Utilities
desc: "Set a color's alpha channel and return a new #RRGGBBAA string."
---

# alpha

`alpha(color, value)` returns a new color with its alpha channel set
to `value`, a number in the `[0, 1]` range. Re-exported from the
[color-bits](https://github.com/romgrk/color-bits) `string` entry, so
it takes any CSS color string the parser accepts and returns a
`#RRGGBBAA` hex string.

## Arguments

| Name    | Type     | Description                                             |
| ------- | -------- | ------------------------------------------------------- |
| `color` | `string` | Any parseable CSS color string.                         |
| `value` | `number` | New alpha in the `[0, 1]` range (`0` clear, `1` solid). |

**Returns:** `string` — a `#RRGGBBAA` hex string.

## Examples

### Fade a swatch

Renders the same color at a few alpha levels over a checkerboard so
the transparency is visible.

```jsx
import { render } from 'pota'
import { alpha } from 'pota/use/color'

function App() {
	const levels = [1, 0.66, 0.33, 0.1]

	return (
		<div
			style={{
				display: 'flex',
				background:
					'repeating-conic-gradient(#ccc 0 25%, #fff 0 50%) 0 0 / 20px 20px',
			}}
		>
			{levels.map(value => (
				<div
					style={{
						'background-color': alpha('#ff0080', value),
						width: '3rem',
						height: '3rem',
					}}
				/>
			))}
		</div>
	)
}

render(App)
```
