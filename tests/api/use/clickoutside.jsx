/** @jsxImportSource pota */
// Tests for pota/use/clickoutside: handler fires on outside clicks,
// once variant, and cleanup on dispose.

import { microtask, test } from '#test'

import { render } from 'pota'
import 'pota/use/clickoutside'

await test('clickoutside - handler runs only for clicks outside the node', async expect => {
	let calls = 0
	let lastTarget
	const dispose = render(
		<div
			id="outside-box"
			use:clickoutside={(event, node) => {
				calls++
				lastTarget = event.target
				expect(node.id).toBe('outside-box')
			}}
		>
			<span id="inside-child">inside</span>
		</div>,
	)

	await microtask()

	// click inside — should NOT trigger
	document
		.querySelector('#inside-child')
		.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))

	expect(calls).toBe(0)

	// click outside — should trigger
	document.body.dispatchEvent(
		new PointerEvent('pointerdown', { bubbles: true }),
	)
	expect(calls).toBe(1)
	expect(lastTarget).toBe(document.body)

	dispose()
})

await test('clickoutside - once variant runs a single time', async expect => {
	let calls = 0
	const dispose = render(
		<div
			id="once-box"
			use:clickoutsideonce={() => {
				calls++
			}}
		>
			inside
		</div>,
	)

	await microtask()

	document.body.dispatchEvent(
		new PointerEvent('pointerdown', { bubbles: true }),
	)
	document.body.dispatchEvent(
		new PointerEvent('pointerdown', { bubbles: true }),
	)

	expect(calls).toBe(1)

	dispose()
})

await test('clickoutside - handler is cleaned up on dispose', async expect => {
	let calls = 0
	const dispose = render(
		<div
			id="cleanup-box"
			use:clickoutside={() => {
				calls++
			}}
		>
			inside
		</div>,
	)

	await microtask()

	// baseline: handler works before dispose
	document.body.dispatchEvent(
		new PointerEvent('pointerdown', { bubbles: true }),
	)
	expect(calls).toBe(1)

	dispose()

	// after dispose, handler should not fire
	document.body.dispatchEvent(
		new PointerEvent('pointerdown', { bubbles: true }),
	)
	expect(calls).toBe(1)
})
