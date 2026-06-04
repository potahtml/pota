---
title: blend
subpath: pota/use/color
topic: Utilities
desc:
  Alpha-composite an overlay color over a background and return the
  mix.
---

# blend

`blend(background, overlay, opacity, gamma)` mixes `overlay` over
`background` at the given `opacity`, returning the fully-opaque
result. Re-exported from the
[color-bits](https://github.com/romgrk/color-bits) `string` entry, so
both inputs are CSS color strings and the result is a `#RRGGBBAA` hex
string.

`gamma` controls the blend curve: `1.0` matches how browsers composite
(linear in sRGB), while `2.2` does a gamma-corrected blend.

## Arguments

| Name         | Type     | Description                                                      |
| ------------ | -------- | ---------------------------------------------------------------- |
| `background` | `string` | The base color underneath.                                       |
| `overlay`    | `string` | The color laid on top, scaled by `opacity`.                      |
| `opacity`    | `number` | Overlay opacity in the `[0, 1]` range.                           |
| `gamma`      | `number` | Gamma coefficient. `1.0` matches the browser; `2.2` corrects it. |

**Returns:** `string` — a `#RRGGBBAA` hex string (alpha is always
`ff`).

## Examples

### Preview an overlay tint

Composites a translucent accent over a card background to see the
final opaque color the user would perceive.

```jsx
import { render } from 'pota'
import { blend } from 'pota/use/color'

function App() {
	const mixed = blend('#1e1e2e', '#ff0080', 0.4, 1.0)

	return (
		<div style={{ display: 'flex', gap: '1rem' }}>
			<div
				style={{
					'background-color': '#1e1e2e',
					width: '4rem',
					height: '4rem',
				}}
			/>
			<div
				style={{
					'background-color': mixed,
					width: '4rem',
					height: '4rem',
				}}
			/>
		</div>
	)
}

render(App)
```
