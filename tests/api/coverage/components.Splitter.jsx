/** @jsxImportSource pota */

// Coverage tests for src/components/Splitter.js — targets the
// uncovered branches the main suite (tests/api/components/splitter.jsx)
// does not exercise:
//   - L83  `if (!target) return`  — no sibling on the target side
//   - L115 `if (!active) return`  — pointermove without a pointerdown
//   - L127 `if (!active) return`  — pointerup without a pointerdown
//   - L132 `catch {}`             — releasePointerCapture throws

import { test, microtask, $ } from '#test'

import { render } from 'pota'
import { Splitter } from 'pota/components'

// `use:css` adds a cached adopted stylesheet the renderer doesn't drop
// on dispose; the harness asserts an empty document.adoptedStyleSheets
// after each test, so clear it on dispose.
const mount = jsx => {
	const dispose = render(jsx)
	return () => {
		dispose()
		document.adoptedStyleSheets = []
	}
}

const pointer = (type, target, x, y, pointerId = 1) =>
	target.dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			pointerId,
			clientX: x,
			clientY: y,
		}),
	)

// --- L83: no target sibling --------------------------------------------

await test('Splitter - no previous sibling bails out (no listeners wired)', async expect => {
	// Rendered alone, the separator is the only body child, so
	// previousElementSibling is null and `ready` returns at L83 before
	// registering pointer handlers or touching body styles.
	const dispose = mount(<Splitter />)

	await microtask()

	const handle = /** @type {HTMLDivElement} */ ($('[role=separator]'))
	expect(handle).not.toBe(null)
	expect(handle.previousElementSibling).toBe(null)

	// Patch capture methods so that, if a (non-existent) pointerdown
	// handler were wired, it would run. It must NOT — the early return
	// means dispatching pointerdown changes nothing.
	handle.setPointerCapture = () => {}
	handle.releasePointerCapture = () => {}

	pointer('pointerdown', handle, 50, 50)
	// Handler never registered → no dragging attribute, no body styles.
	expect(handle.hasAttribute('data-dragging')).toBe(false)
	expect(document.body.style.userSelect).toBe('')
	expect(document.body.style.cursor).toBe('')

	dispose()
})

await test('Splitter - target="next" with no next sibling bails out', async expect => {
	// Separator is the last child → nextElementSibling is null → L83.
	const dispose = mount(
		<>
			<div id="left" style={{ width: '100px', height: '50px' }} />
			<Splitter target="next" initial={120} />
		</>,
	)

	await microtask()

	const handle = /** @type {HTMLDivElement} */ ($('[role=separator]'))
	const left = /** @type {HTMLDivElement} */ ($('#left'))

	expect(handle.nextElementSibling).toBe(null)
	// Early return means initial size is never applied to any sibling.
	expect(left.style.width).toBe('100px')
	expect(left.style.minWidth).toBe('')
	expect(left.style.maxWidth).toBe('')

	dispose()
})

// --- L115 / L127: events arriving while not active ---------------------

await test('Splitter - pointermove without pointerdown is a no-op (L115)', async expect => {
	const dispose = mount(
		<>
			<div id="left" style={{ width: '100px', height: '50px' }} />
			<Splitter initial={100} />
			<div id="right" style={{ width: '100px', height: '50px' }} />
		</>,
	)

	await microtask()

	const handle = /** @type {HTMLDivElement} */ ($('[role=separator]'))
	const left = /** @type {HTMLDivElement} */ ($('#left'))

	// initial=100 was applied on mount; a stray pointermove (active is
	// still false, no preceding pointerdown) must hit L115 and return
	// without recomputing/resizing.
	expect(left.style.width).toBe('100px')

	pointer('pointermove', handle, 999, 0)

	// unchanged — the move was ignored
	expect(left.style.width).toBe('100px')
	expect(left.style.minWidth).toBe('100px')
	expect(left.style.maxWidth).toBe('100px')

	dispose()
})

await test('Splitter - pointerup without pointerdown is a no-op (L127)', async expect => {
	const key = 'pota-splitter-cov-up-noop-' + Math.random()

	try {
		const dispose = mount(
			<>
				<div id="left" style={{ width: '100px', height: '50px' }} />
				<Splitter initial={100} persist={key} />
				<div id="right" style={{ width: '100px', height: '50px' }} />
			</>,
		)

		await microtask()

		const handle = /** @type {HTMLDivElement} */ (
			$('[role=separator]')
		)

		// A bare pointerup with no prior pointerdown: active is false, so
		// L127 returns before releasePointerCapture / body-style reset /
		// localStorage persist. If it did NOT return early, the persist
		// branch would write the current size (100) to localStorage.
		pointer('pointerup', handle, 50, 0)

		expect(document.body.style.userSelect).toBe('')
		expect(document.body.style.cursor).toBe('')
		// persist must not have fired (early return skipped it)
		expect(localStorage.getItem(key)).toBe(null)

		dispose()
	} finally {
		localStorage.removeItem(key)
	}
})

// --- L132: releasePointerCapture throws --------------------------------

await test('Splitter - pointerup swallows releasePointerCapture throw (L132)', async expect => {
	const dispose = mount(
		<>
			<div id="left" style={{ width: '100px', height: '50px' }} />
			<Splitter initial={100} />
			<div id="right" style={{ width: '100px', height: '50px' }} />
		</>,
	)

	await microtask()

	const handle = /** @type {HTMLDivElement} */ ($('[role=separator]'))

	// setPointerCapture must succeed so pointerdown marks active=true.
	handle.setPointerCapture = () => {}
	// releasePointerCapture throws — the try/catch at L130-132 must
	// swallow it so the rest of onPointerUp still runs.
	let released = false
	handle.releasePointerCapture = () => {
		released = true
		throw new Error('InvalidPointerId')
	}

	pointer('pointerdown', handle, 100, 0)
	expect(handle.hasAttribute('data-dragging')).toBe(true)
	expect(document.body.style.userSelect).toBe('none')

	// pointerup: releasePointerCapture throws, catch swallows, and the
	// handler proceeds to clear body styles + drop dragging.
	pointer('pointerup', handle, 120, 0)

	expect(released).toBe(true)
	expect(handle.hasAttribute('data-dragging')).toBe(false)
	expect(document.body.style.userSelect).toBe('')
	expect(document.body.style.cursor).toBe('')

	dispose()
})
