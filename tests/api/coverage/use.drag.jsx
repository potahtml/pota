/** @jsxImportSource pota */
// Coverage for pota/use/drag uncovered branches:
//  - line 70: `rectW ? (elementX / rectW) * 100 : 0` — the `: 0`
//    branch, taken when the element has zero width at pointerdown.
//  - line 82: `if (e.pointerId !== pointerId) return` in onPointerUp —
//    the early-return branch, taken when a pointerup carries a
//    different pointerId than the active gesture.

import { microtask, test, $ } from '#test'

import { render } from 'pota'
import { draggable } from 'pota/use/drag'

const pointer = (type, target, x, y, pointerId = 1) =>
	target.dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			pointerId,
			clientX: x,
			clientY: y,
		}),
	)

await test('drag - zero-width rect yields percentX 0 (no divide)', async expect => {
	const starts = []
	const moves = []

	const dispose = render(
		<div
			id="handle-zero"
			// width:0 → rect.width === 0 → percentX falls back to 0
			style="position: fixed; left: 100px; top: 200px; width: 0px; height: 100px;"
			use:ref={draggable({
				onStart: info => starts.push(info),
				onMove: info => moves.push(info),
			})}
		/>,
		document.body,
	)

	await microtask()

	const handle = $('#handle-zero')

	pointer('pointerdown', handle, 100, 250)
	pointer('pointermove', document, 140, 230)

	// rectW === 0 → percentX is the `: 0` literal, not a division.
	// rectH === 100 (non-zero) keeps percentY on the truthy branch.
	expect(starts[0].percentX).toBe(0)
	expect(moves[0].percentX).toBe(0)
	expect(moves[0].percentY).toBe(30)

	dispose()
})

await test('drag - pointerup with foreign pointerId is ignored', async expect => {
	const ends = []
	const moves = []

	const dispose = render(
		<div
			id="handle-foreign"
			use:ref={draggable({
				onMove: info => moves.push(info),
				onEnd: info => ends.push(info),
			})}
		/>,
		document.body,
	)

	await microtask()

	const handle = $('#handle-foreign')

	// start a gesture with pointerId 1
	pointer('pointerdown', handle, 10, 10, 1)

	// pointerup from a DIFFERENT pointer must hit the early return:
	// onEnd does NOT fire and the gesture stays active.
	pointer('pointerup', document, 99, 99, 2)
	expect(ends).toEqual([])

	// gesture still active → moves with the original pointerId work
	pointer('pointermove', document, 40, 30, 1)
	expect(moves.length).toBe(1)
	expect({ dx: moves[0].dx, dy: moves[0].dy }).toEqual({
		dx: 30,
		dy: 20,
	})

	// the matching pointerup ends the gesture
	pointer('pointerup', document, 40, 30, 1)
	expect(ends.length).toBe(1)

	dispose()
})
