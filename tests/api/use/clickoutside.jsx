/** @jsxImportSource pota */
// Tests for pota/use/clickoutside: handler fires on outside clicks,
// once variant, and cleanup on dispose.

import { microtask, test } from '#test'

import { render } from 'pota'
import { clickOutside, escape } from 'pota/use/clickoutside'

await test('clickoutside - handler runs only for clicks outside the node', async expect => {
	let calls = 0
	let lastTarget
	const dispose = render(
		<div
			id="outside-box"
			use:ref={clickOutside((event, node) => {
				calls++
				lastTarget = event.target
				expect(node.id).toBe('outside-box')
			})}
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
			use:ref={clickOutside(
				() => {
					calls++
				},
				{ once: true },
			)}
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
			use:ref={clickOutside(() => {
				calls++
			})}
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

// --- clicking a deeply nested descendant does not trigger ---------------

await test('clickoutside - deeply nested descendants are treated as inside', async expect => {
	let calls = 0
	const dispose = render(
		<div
			id="deep-outer"
			use:ref={clickOutside(() => {
				calls++
			})}
		>
			<section>
				<article>
					<span id="deepest">deep</span>
				</article>
			</section>
		</div>,
	)

	await microtask()

	document
		.querySelector('#deepest')
		.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))

	expect(calls).toBe(0)

	dispose()
})

// --- two independent clickoutside handlers ------------------------------

await test('clickoutside - two independent handlers fire independently', async expect => {
	let aCount = 0
	let bCount = 0

	const dispose = render(
		<>
			<div
				id="panel-a"
				use:ref={clickOutside(() => {
					aCount++
				})}
			>
				a
			</div>
			<div
				id="panel-b"
				use:ref={clickOutside(() => {
					bCount++
				})}
			>
				b
			</div>
		</>,
	)

	await microtask()

	// click on panel-a: counts as outside for panel-b
	document
		.querySelector('#panel-a')
		.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))

	expect(aCount).toBe(0)
	expect(bCount).toBe(1)

	// click on panel-b: counts as outside for panel-a
	document
		.querySelector('#panel-b')
		.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))

	expect(aCount).toBe(1)
	expect(bCount).toBe(1)

	dispose()
})

// --- once variant: is also cleaned up on dispose ------------------------

await test('clickoutside - once variant is also cleaned up on dispose', async expect => {
	let calls = 0

	const dispose = render(
		<div
			id="once-dispose"
			use:ref={clickOutside(
				() => {
					calls++
				},
				{ once: true },
			)}
		>
			inside
		</div>,
	)

	await microtask()

	dispose()

	document.body.dispatchEvent(
		new PointerEvent('pointerdown', { bubbles: true }),
	)

	expect(calls).toBe(0)
})

// --- escape ---------------------------------------------------------

await test('clickoutside - escape fires on document Escape keydown', async expect => {
	let calls = 0
	let lastId = null
	const dispose = render(
		<div
			id="esc-box"
			use:ref={escape((e, node) => {
				calls++
				lastId = node.id
			})}
		>
			contents
		</div>,
	)

	await microtask()

	// Escape outside the element still fires (it's document-scoped)
	document.body.dispatchEvent(
		new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }),
	)
	expect(calls).toBe(1)
	expect(lastId).toBe('esc-box')

	// non-Escape keys don't fire
	document.body.dispatchEvent(
		new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }),
	)
	expect(calls).toBe(1)

	dispose()

	// after dispose, listener is gone
	document.body.dispatchEvent(
		new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }),
	)
	expect(calls).toBe(1)
})
