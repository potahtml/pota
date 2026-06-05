---
title: textColorWhenBackgroundIsBlack
subpath: pota/use/color
topic: Utilities
desc: Lighten a color until it's APCA-readable on black.
---

# textColorWhenBackgroundIsBlack

`textColorWhenBackgroundIsBlack(color)` iteratively lightens `color`
in 5% steps until it reaches APCA Lc ≥ 60 on a black background,
capped at 20 steps, returning the adjusted hex string. For the
white-background companion see
[textColorWhenBackgroundIsWhite](/use/color/textColorWhenBackgroundIsWhite);
to simply pick `'white'` or `'black'` for text on a color, see
[textColor](/use/color/textColor).

## Arguments

| Name    | Type     | Description                          |
| ------- | -------- | ------------------------------------ |
| `color` | `string` | The color to make readable on black. |

**Returns:** `string` — the adjusted color as a hex string.

## Examples

### Keep a brand color readable on black

Shifts a user-chosen color light enough to stay legible against a
black panel, deriving the adjusted hex with a [memo](/memo).

```jsx
import { render, signal, memo } from 'pota'
import { textColorWhenBackgroundIsBlack } from 'pota/use/color'

function App() {
	const brand = signal('#1133aa')
	const readable = memo(() =>
		textColorWhenBackgroundIsBlack(brand.read()),
	)

	return (
		<div style={{ 'background-color': 'black', padding: '1rem' }}>
			<input
				value={brand.read()}
				on:input={e => brand.write(e.currentTarget.value)}
			/>
			<p style={{ color: readable }}>Readable on black</p>
		</div>
	)
}

render(App)
```
