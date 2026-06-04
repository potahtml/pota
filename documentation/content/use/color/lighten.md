---
title: lighten
subpath: pota/use/color
topic: Utilities
desc: Lighten a color by an amount and return a new #RRGGBBAA string.
---

# lighten

`lighten(color, value)` returns a lighter version of `color`, where
`value` is a number in the `[0, 1]` range. Re-exported from the
[color-bits](https://github.com/romgrk/color-bits) `string` entry, so
it takes any CSS color string the parser accepts and returns a
`#RRGGBBAA` hex string. See [darken](/use/color/darken) for the
inverse.

## Arguments

| Name    | Type     | Description                                             |
| ------- | -------- | ------------------------------------------------------- |
| `color` | `string` | Any parseable CSS color string.                         |
| `value` | `number` | How much to lighten, in the `[0, 1]` range (`0` no-op). |

**Returns:** `string` — a `#RRGGBBAA` hex string.

## Examples

### Lightness ramp

Renders the same color lightened by increasing amounts so the
progression is visible side by side.

```jsx
import { render } from 'pota'
import { lighten } from 'pota/use/color'

function App() {
	const amounts = [0, 0.15, 0.3, 0.45]

	return (
		<div style={{ display: 'flex' }}>
			{amounts.map(amount => (
				<div
					style={{
						'background-color': lighten('#ff0080', amount),
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
