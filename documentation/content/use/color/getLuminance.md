---
title: getLuminance
subpath: pota/use/color
topic: Utilities
desc: Compute the relative luminance of a color as a number.
---

# getLuminance

`getLuminance(color)` returns the relative luminance of `color` as a
number — roughly its perceived brightness, useful for deciding whether
to place light or dark text on top. Re-exported from the
[color-bits](https://github.com/romgrk/color-bits) `string` entry, so
it takes any CSS color string the parser accepts. For a ready-made
readable-text pick see [textColor](/use/color/textColor).

## Arguments

| Name    | Type     | Description                     |
| ------- | -------- | ------------------------------- |
| `color` | `string` | Any parseable CSS color string. |

**Returns:** `number` — the relative luminance in the `[0, 1]` range
(`0` darkest black, `1` lightest white), rounded to 3 decimals.

## Examples

### Pick readable text by luminance

Labels each swatch with the color's luminance and flips the text color
based on a threshold so it stays legible.

```jsx
import { render } from 'pota'
import { getLuminance } from 'pota/use/color'

function App() {
	const colors = ['#ffffff', '#ff0080', '#1e1e2e', '#000000']

	return (
		<div style={{ display: 'flex', gap: '0.5rem' }}>
			{colors.map(color => {
				const luminance = getLuminance(color)
				return (
					<div
						style={{
							'background-color': color,
							color: luminance > 0.4 ? '#000' : '#fff',
							padding: '1rem',
							'font-family': 'monospace',
						}}
					>
						{luminance.toFixed(2)}
					</div>
				)
			})}
		</div>
	)
}

render(App)
```
