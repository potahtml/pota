---
title: scale
subpath: pota/use/color
topic: Utilities
desc: Perceptually-uniform OkLab gradient ramp.
---

# scale

`scale(colors, count?)` returns an array of `count` CSS
`oklab(L a b / alpha)` strings that walk through every stop in
`colors`, interpolated in OkLab space for perceptually-uniform
gradients. Pass any CSS color string the `color-bits` parser accepts;
the browser handles gamut mapping natively from the `oklab()` output.

## Arguments

| Name     | Type       | Description                                    |
| -------- | ---------- | ---------------------------------------------- |
| `colors` | `string[]` | Stop colors the ramp passes through, in order. |
| `count`  | `number`   | Length of the returned ramp. Defaults to `10`. |

**Returns:** `string[]` — `count` CSS `oklab(L a b / alpha)` strings.

## Examples

### Render a swatch strip

Builds a 12-step ramp between two stops and renders one swatch per
entry.

```jsx
import { render } from 'pota'
import { scale } from 'pota/use/color'

function App() {
	const ramp = scale(['#ff0080', '#00ffd5'], 12)

	return (
		<div style={{ display: 'flex' }}>
			{ramp.map(color => (
				<div
					style={{
						'background-color': color,
						width: '2rem',
						height: '2rem',
					}}
				/>
			))}
		</div>
	)
}

render(App)
```

### Multi-stop ramp

Passing more than two stops walks the ramp through each in turn,
spreading `count` samples evenly across the whole path.

```jsx
import { render } from 'pota'
import { scale } from 'pota/use/color'

function App() {
	const ramp = scale(['#000000', '#ff0080', '#00ffd5', '#ffffff'], 24)

	return (
		<div style={{ display: 'flex' }}>
			{ramp.map(color => (
				<div
					style={{
						'background-color': color,
						width: '1rem',
						height: '3rem',
					}}
				/>
			))}
		</div>
	)
}

render(App)
```
