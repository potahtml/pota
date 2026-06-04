---
title: drag
subpath: pota/use/drag
topic: Interaction
desc:
  Ref factory that turns an element into a drag handle and reports
  cumulative deltas and pointer position.
---

# `pota/use/drag`

`draggable` is a ref factory that turns an element into a drag handle
and reports cumulative deltas and pointer position. `onMove` is called
on every `pointermove` between `pointerdown` and
`pointerup`/`pointercancel`, with the cumulative delta from the
starting position.

`pointermove`, `pointerup`, and `pointercancel` are listened for on
`document`, so the gesture continues even when the pointer leaves the
handle. The element's bounding rect is snapshotted once per gesture,
so element-relative coordinates stay meaningful even if the element
moves while dragging.

Use `dx`/`dy` when you're moving the element itself. Use
`elementX`/`elementY` or `percentX`/`percentY` for sliders, range
pickers, and color canvases — where the element doesn't move during
the gesture and the pointer position within its bounds is what
matters.

## Arguments

`draggable` takes a single options object and returns a ref factory
for [use:ref](/guide/jsx/use:ref).

| Option    | Type                       | Description                                                         |
| --------- | -------------------------- | ------------------------------------------------------------------- |
| `onMove`  | `(info: DragInfo) => void` | Required. Fires on every `pointermove` during a drag gesture.       |
| `onStart` | `(info: DragInfo) => void` | Optional. Fires once on `pointerdown` when a gesture begins.        |
| `onEnd`   | `(info: DragInfo) => void` | Optional. Fires on `pointerup`/`pointercancel` when a gesture ends. |

**Returns:** a ref factory — `(node: HTMLElement) => void` — to pass
to `use:ref`.

## DragInfo

Each callback receives a `DragInfo` object:

| Field                  | Description                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `dx`, `dy`             | Cumulative delta from the pointer position at `pointerdown`.                         |
| `x`, `y`               | Current pointer position (`clientX` / `clientY`).                                    |
| `originX`, `originY`   | Pointer position at `pointerdown`.                                                   |
| `elementX`, `elementY` | Pointer position relative to the element's box at gesture start, clamped to the box. |
| `percentX`, `percentY` | `elementX` / `elementY` expressed as `0`–`100`.                                      |
| `event`                | The raw `PointerEvent`.                                                              |

## Examples

### Drag a box around

Drive an absolutely-positioned element from `dx`/`dy` deltas. Track
the element's last commit on `onEnd` so the next drag starts where the
previous one left off.

```jsx
import { render, signal } from 'pota'
import { draggable } from 'pota/use/drag'

function App() {
	const pos = signal({ x: 40, y: 40 })
	let committed = { x: 40, y: 40 }

	return (
		<div
			use:ref={draggable({
				onMove(info) {
					pos.write({
						x: committed.x + info.dx,
						y: committed.y + info.dy,
					})
				},
				onEnd() {
					committed = pos.read()
				},
			})}
			style={() => ({
				position: 'absolute',
				left: pos.read().x + 'px',
				top: pos.read().y + 'px',
				width: '120px',
				height: '120px',
				background: 'rebeccapurple',
				color: 'white',
				'border-radius': '8px',
				display: 'grid',
				'place-items': 'center',
				cursor: 'grab',
				'user-select': 'none',
				'touch-action': 'none',
			})}
		>
			drag me
		</div>
	)
}

render(App)
```

### Slider from percent

Use `percentX` to build a horizontal slider. The element doesn't move;
the pointer position within its bounds drives the value.

```jsx
import { render, signal } from 'pota'
import { draggable } from 'pota/use/drag'

function App() {
	const value = signal(50)

	return (
		<div style={{ width: '240px', 'user-select': 'none' }}>
			<div
				use:ref={draggable({
					onMove(info) {
						value.write(Math.round(info.percentX))
					},
				})}
				style={{
					position: 'relative',
					height: '24px',
					background: '#eee',
					'border-radius': '12px',
					cursor: 'pointer',
					'touch-action': 'none',
				}}
			>
				<div
					style={() => ({
						position: 'absolute',
						top: '0',
						left: '0',
						height: '100%',
						width: value.read() + '%',
						background: 'rebeccapurple',
						'border-radius': '12px',
					})}
				/>
			</div>
			<p>{() => value.read() + '%'}</p>
		</div>
	)
}

render(App)
```
