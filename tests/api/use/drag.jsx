/** @jsxImportSource pota */
// Tests for pota/use/drag: draggable ref factory tracks
// pointerdown/move/up gestures.

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

await test('drag - draggable reports delta from pointerdown origin', async expect => {
	const moves = []
	const starts = []
	const ends = []

	const dispose = render(
		<div
			id="handle"
			use:ref={draggable({
				onStart: info => starts.push(info),
				onMove: info => moves.push(info),
				onEnd: info => ends.push(info),
			})}
		/>,
		document.body,
	)

	await microtask()

	const handle = $('#handle')

	pointer('pointerdown', handle, 100, 200)
	pointer('pointermove', document, 130, 220)
	pointer('pointermove', document, 150, 250)
	pointer('pointerup', document, 150, 250)

	expect(starts.length).toBe(1)
	expect({
		x: starts[0].x,
		y: starts[0].y,
		dx: starts[0].dx,
		dy: starts[0].dy,
	}).toEqual({ x: 100, y: 200, dx: 0, dy: 0 })

	expect(moves.length).toBe(2)
	expect({ dx: moves[0].dx, dy: moves[0].dy }).toEqual({
		dx: 30,
		dy: 20,
	})
	expect({ dx: moves[1].dx, dy: moves[1].dy }).toEqual({
		dx: 50,
		dy: 50,
	})

	expect(ends.length).toBe(1)
	expect({ dx: ends[0].dx, dy: ends[0].dy }).toEqual({
		dx: 50,
		dy: 50,
	})

	dispose()
})

await test('drag - moves outside of an active gesture are ignored', async expect => {
	const moves = []

	const dispose = render(
		<div
			id="handle2"
			use:ref={draggable({
				onMove: info => moves.push(info),
			})}
		/>,
		document.body,
	)

	await microtask()

	// move without prior pointerdown — should be ignored
	pointer('pointermove', document, 50, 50)
	expect(moves).toEqual([])

	dispose()
})

await test('drag - cleans up listeners on dispose', async expect => {
	const moves = []

	const dispose = render(
		<div
			id="handle3"
			use:ref={draggable({
				onMove: info => moves.push(info),
			})}
		/>,
		document.body,
	)

	await microtask()

	const handle = $('#handle3')
	pointer('pointerdown', handle, 0, 0)

	dispose()

	// after dispose, no more move callbacks
	pointer('pointermove', document, 100, 100)
	expect(moves).toEqual([])
})

await test('drag - reports element-relative coords and percent clamped to rect', async expect => {
	const moves = []
	const starts = []

	const dispose = render(
		<div
			id="handle4"
			style="position: fixed; left: 100px; top: 200px; width: 200px; height: 100px;"
			use:ref={draggable({
				onStart: info => starts.push(info),
				onMove: info => moves.push(info),
			})}
		/>,
		document.body,
	)

	await microtask()

	const handle = $('#handle4')

	pointer('pointerdown', handle, 150, 250) // inside: 50,50 → 25%,50%
	pointer('pointermove', document, 200, 220) // 100,20 → 50%,20%
	pointer('pointermove', document, 500, 220) // past right → clamped 200,20 → 100%,20%
	pointer('pointermove', document, 50, 220) // past left → clamped 0,20 → 0%,20%
	pointer('pointerup', document, 50, 220)

	expect({
		elementX: starts[0].elementX,
		elementY: starts[0].elementY,
		percentX: starts[0].percentX,
		percentY: starts[0].percentY,
	}).toEqual({
		elementX: 50,
		elementY: 50,
		percentX: 25,
		percentY: 50,
	})

	expect({
		elementX: moves[0].elementX,
		percentX: moves[0].percentX,
		percentY: moves[0].percentY,
	}).toEqual({ elementX: 100, percentX: 50, percentY: 20 })

	expect({
		elementX: moves[1].elementX,
		percentX: moves[1].percentX,
	}).toEqual({
		elementX: 200,
		percentX: 100,
	})

	expect({
		elementX: moves[2].elementX,
		percentX: moves[2].percentX,
	}).toEqual({
		elementX: 0,
		percentX: 0,
	})

	dispose()
})
