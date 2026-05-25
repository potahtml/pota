/** @jsxImportSource pota */
// Tests for pota/use/mouse: useMouseButton, mouseButtons (held-state
// primitives) plus useMousePosition / mousePosition.

import { test } from '#test'

import { syncEffect } from 'pota'
import {
	mouseButtons,
	mousePosition,
	useMouseButton,
	useMousePosition,
} from 'pota/use/mouse'

const pointer = (type, button, x = 0, y = 0) =>
	window.dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			button,
			clientX: x,
			clientY: y,
		}),
	)
const move = (x, y) =>
	window.dispatchEvent(
		new PointerEvent('pointermove', {
			bubbles: true,
			clientX: x,
			clientY: y,
		}),
	)
const blurAll = () => window.dispatchEvent(new Event('blur'))

await test('mouse - useMouseButton flips reactively on pointerdown/pointerup', async expect => {
	const left = useMouseButton(0)
	expect(left()).toBe(false)

	pointer('pointerdown', 0)
	expect(left()).toBe(true)
	expect(mouseButtons().has(0)).toBe(true)

	pointer('pointerup', 0)
	expect(left()).toBe(false)
	expect(mouseButtons().has(0)).toBe(false)

	blurAll()
})

await test('mouse - useMouseButton tracks distinct buttons independently', async expect => {
	const left = useMouseButton(0)
	const right = useMouseButton(2)

	pointer('pointerdown', 0)
	pointer('pointerdown', 2)
	expect(left()).toBe(true)
	expect(right()).toBe(true)
	expect(mouseButtons().size).toBe(2)

	pointer('pointerup', 0)
	expect(left()).toBe(false)
	expect(right()).toBe(true)

	blurAll()
})

await test('mouse - duplicate pointerdown does not re-fire the signal', async expect => {
	const transitions = []
	const middle = useMouseButton(1)
	syncEffect(() => transitions.push(middle()))

	expect(transitions).toEqual([false])

	pointer('pointerdown', 1)
	expect(transitions).toEqual([false, true])

	// duplicate down — already held, should be a no-op
	pointer('pointerdown', 1)
	pointer('pointerdown', 1)
	expect(transitions).toEqual([false, true])

	pointer('pointerup', 1)
	expect(transitions).toEqual([false, true, false])

	blurAll()
})

await test('mouse - window blur clears all held buttons', async expect => {
	const a = useMouseButton(0)
	const b = useMouseButton(2)

	pointer('pointerdown', 0)
	pointer('pointerdown', 2)
	expect(a()).toBe(true)
	expect(b()).toBe(true)

	blurAll()
	expect(a()).toBe(false)
	expect(b()).toBe(false)
	expect(mouseButtons().size).toBe(0)
})

await test('mouse - pointercancel clears the held state', async expect => {
	const right = useMouseButton(2)
	pointer('pointerdown', 2)
	expect(right()).toBe(true)

	pointer('pointercancel', 2)
	expect(right()).toBe(false)

	blurAll()
})

await test('mouse - useMousePosition is reactive and reflects pointermove client coords', async expect => {
	const pos = useMousePosition()
	const seen = []
	syncEffect(() => seen.push(pos()))

	const initial = seen.length
	move(120, 240)
	expect(seen.length).toBe(initial + 1)
	expect(seen[initial]).toEqual({ x: 120, y: 240 })

	move(0, 0)
	expect(seen.at(-1)).toEqual({ x: 0, y: 0 })
})

await test('mouse - mousePosition returns a fresh snapshot after each move', async expect => {
	move(50, 60)
	expect(mousePosition()).toEqual({ x: 50, y: 60 })

	move(70, 80)
	expect(mousePosition()).toEqual({ x: 70, y: 80 })

	move(0, 0)
})
