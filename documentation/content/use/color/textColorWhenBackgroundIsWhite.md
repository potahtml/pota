---
title: textColorWhenBackgroundIsWhite
subpath: pota/use/color
topic: Utilities
desc: Darken a color until it's APCA-readable on white.
---

# textColorWhenBackgroundIsWhite

`textColorWhenBackgroundIsWhite(color)` iteratively darkens `color` in
5% steps until it reaches APCA Lc ≥ 60 on a white background, capped
at 20 steps, returning the adjusted hex string. For the
black-background companion see
[textColorWhenBackgroundIsBlack](/use/color/textColorWhenBackgroundIsBlack);
to simply pick `'white'` or `'black'` for text on a color, see
[textColor](/use/color/textColor).

## Arguments

| Name    | Type     | Description                          |
| ------- | -------- | ------------------------------------ |
| `color` | `string` | The color to make readable on white. |

**Returns:** `string` — the adjusted color as a hex string.

## Examples

### Keep a brand color readable on white

Shifts a user-chosen color dark enough to stay legible against a white
panel, deriving the adjusted hex with a [memo](/memo).

```jsx
import { render, signal, memo } from 'pota'
import { textColorWhenBackgroundIsWhite } from 'pota/use/color'

function App() {
	const brand = signal('#ffcc00')
	const readable = memo(() =>
		textColorWhenBackgroundIsWhite(brand.read()),
	)

	return (
		<div style={{ 'background-color': 'white', padding: '1rem' }}>
			<input
				value={brand.read()}
				on:input={e => brand.write(e.target.value)}
			/>
			<p style={{ color: readable }}>Readable on white</p>
		</div>
	)
}

render(App)
```
