---
title: textColor
subpath: pota/use/color
topic: Utilities
desc: Returns 'white' or 'black' — whichever reads better on a color.
---

# textColor

`textColor(color)` returns `'white'` or `'black'` — whichever
contrasts better as text on top of `color`, measured with APCA
contrast. For helpers that adjust the input color itself until it's
readable on a fixed background, see
[textColorWhenBackgroundIsBlack](/use/color/textColorWhenBackgroundIsBlack)
and
[textColorWhenBackgroundIsWhite](/use/color/textColorWhenBackgroundIsWhite).

## Arguments

| Name    | Type     | Description                            |
| ------- | -------- | -------------------------------------- |
| `color` | `string` | The background color to place text on. |

**Returns:** `'white' | 'black'` — the color that reads better on top
of `color`.

## Examples

### Auto-contrasting label

Picks a legible text color for a swatch from a single source color,
deriving the foreground with a [memo](/memo) so it stays in sync.

```jsx
import { render, signal, memo } from 'pota'
import { textColor } from 'pota/use/color'

function App() {
	const bg = signal('#ffcc00')
	const fg = memo(() => textColor(bg.read()))

	return (
		<div>
			<input
				value={bg.read()}
				on:input={e => bg.write(e.target.value)}
			/>
			<div
				style={{
					'background-color': bg.read,
					color: fg,
					padding: '1rem',
				}}
			>
				Readable on any background
			</div>
		</div>
	)
}

render(App)
```
