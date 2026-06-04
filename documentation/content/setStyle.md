---
title: setStyle
subpath: pota
topic: Props
desc:
  Imperatively set a single style property on an element, unwrapping
  reactive values.
---

# setStyle

Imperatively set a single style property on an element, unwrapping
reactive values. A value of `null`, `undefined` or `false` removes the
property. The declarative form is `style:__` (or a `style` object);
for entire stylesheets see [css](/use/css).

Call `setStyle` directly when you are building elements imperatively,
writing a [ref](/ref)-driven effect, or animating a property outside
the render tree.

## Arguments

| name    | type                            | description                                                                                             |
| ------- | ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `node`  | `Element`                       | Target element.                                                                                         |
| `name`  | `string`                        | CSS property name (kebab-case, e.g. `'border-radius'`).                                                 |
| `value` | `string \| number \| () => ...` | Property value; functions are unwrapped reactively. `null` / `undefined` / `false` remove the property. |

**Returns:** `void`

## Examples

### Cursor-following dot

Drives the `left`/`top` of an absolutely-positioned span from `x`/`y`
signals updated on `mousemove`, by reading the signals inside a
reactive child.

```jsx
import { ref, render, setStyle, signal } from 'pota'

function App() {
	const dot = ref()
	const x = signal(0)
	const y = signal(0)

	return (
		<div
			on:mousemove={e => {
				x.write(e.clientX)
				y.write(e.clientY)
			}}
			style={{
				width: '100vw',
				height: '100vh',
				position: 'relative',
			}}
		>
			<span
				use:ref={dot}
				style={{
					position: 'absolute',
					width: '10px',
					height: '10px',
					background: 'red',
					'border-radius': '50%',
				}}
			/>
			{() => {
				setStyle(dot(), 'left', `${x.read()}px`)
				setStyle(dot(), 'top', `${y.read()}px`)
			}}
		</div>
	)
}

render(App)
```

### Setting styles from a ref

Applies reactive style properties once the element is captured, here
from inside an [effect](/effect).

```jsx
import { effect, ref, render, setStyle } from 'pota'

function App() {
	const element = ref()

	effect(() => {
		if (element()) {
			setStyle(element(), 'padding', () => '8px')
			setStyle(element(), 'border', () => '4px solid blue')
		}
	})

	return <div use:ref={element} />
}

render(App)
```
