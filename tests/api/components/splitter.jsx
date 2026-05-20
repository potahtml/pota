/** @jsxImportSource pota */

// Tests for the Splitter component: separator role/attributes,
// initial size, drag-driven resize on prev/next sibling, min/max
// clamping, persist via localStorage, body inline-style cleanup,
// and orientation switching.

import { test, microtask, $ } from '#test'

import { render } from 'pota'
import { Splitter } from 'pota/components'

// Synthetic PointerEvents don't track a real active pointer in Chrome,
// so node.setPointerCapture(pointerId) throws InvalidPointerId.
// Replace both capture methods with no-ops on the handle for tests.
const stubCapture = el => {
	el.setPointerCapture = () => {}
	el.releasePointerCapture = () => {}
}

// The Splitter uses `use:css` which adds a cached adopted stylesheet
// the renderer doesn't remove on dispose. The harness asserts an
// empty `document.adoptedStyleSheets` after every test, so wrap
// `render()` to also clear the array on dispose.
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

// --- structure & attributes --------------------------------------------

await test('Splitter - renders a separator with vertical defaults', async expect => {
	const dispose = mount(
		<>
			<div id="left" style={{ width: '100px', height: '50px' }} />
			<Splitter />
			<div id="right" style={{ width: '100px', height: '50px' }} />
		</>,
	)

	await microtask()

	const handle = /** @type {HTMLDivElement} */ (
		$('[role=separator]')
	)
	expect(handle.tagName).toBe('DIV')
	expect(handle.getAttribute('role')).toBe('separator')
	expect(handle.getAttribute('data-orientation')).toBe('vertical')
	expect(handle.getAttribute('aria-orientation')).toBe('vertical')
	// `data-dragging` follows pota's boolean-attribute semantics:
	// absent when false, present (value `""`) when true. The scoped
	// CSS selector is `class[data-dragging]`, so presence is what
	// matters here — not a literal `"true"` / `"false"` string.
	expect(handle.hasAttribute('data-dragging')).toBe(false)

	dispose()
})

await test('Splitter - horizontal orientation reflects on attributes', async expect => {
	const dispose = mount(
		<>
			<div id="top" style={{ width: '100px', height: '50px' }} />
			<Splitter orientation="horizontal" />
			<div id="bot" style={{ width: '100px', height: '50px' }} />
		</>,
	)

	await microtask()

	const handle = /** @type {HTMLDivElement} */ (
		$('[role=separator]')
	)
	expect(handle.getAttribute('data-orientation')).toBe('horizontal')
	expect(handle.getAttribute('aria-orientation')).toBe('horizontal')

	dispose()
})

await test('Splitter - applies the class prop', async expect => {
	const dispose = mount(
		<>
			<div id="a" />
			<Splitter class="custom" />
			<div id="b" />
		</>,
	)

	await microtask()

	const handle = /** @type {HTMLDivElement} */ (
		$('[role=separator]')
	)
	expect(handle.classList.contains('custom')).toBe(true)

	dispose()
})

// --- initial size ------------------------------------------------------

await test('Splitter - initial size locks previousElementSibling width', async expect => {
	const dispose = mount(
		<>
			<div id="left" style={{ width: '100px', height: '50px' }} />
			<Splitter initial={150} />
			<div id="right" style={{ width: '100px', height: '50px' }} />
		</>,
	)

	await microtask()

	const left = /** @type {HTMLDivElement} */ ($('#left'))
	expect(left.style.width).toBe('150px')
	expect(left.style.minWidth).toBe('150px')
	expect(left.style.maxWidth).toBe('150px')

	dispose()
})

await test('Splitter - target="next" locks nextElementSibling width', async expect => {
	const dispose = mount(
		<>
			<div id="left" style={{ width: '100px', height: '50px' }} />
			<Splitter initial={120} target="next" />
			<div id="right" style={{ width: '100px', height: '50px' }} />
		</>,
	)

	await microtask()

	const right = /** @type {HTMLDivElement} */ ($('#right'))
	expect(right.style.width).toBe('120px')
	expect(right.style.minWidth).toBe('120px')
	expect(right.style.maxWidth).toBe('120px')

	dispose()
})

await test('Splitter - horizontal orientation drives height, not width', async expect => {
	const dispose = mount(
		<>
			<div id="top" style={{ width: '100px', height: '50px' }} />
			<Splitter orientation="horizontal" initial={75} />
			<div id="bot" style={{ width: '100px', height: '50px' }} />
		</>,
	)

	await microtask()

	const top = /** @type {HTMLDivElement} */ ($('#top'))
	expect(top.style.height).toBe('75px')
	expect(top.style.minHeight).toBe('75px')
	expect(top.style.maxHeight).toBe('75px')
	// width remains as the original inline value
	expect(top.style.width).toBe('100px')

	dispose()
})

await test('Splitter - no initial / no persist leaves siblings untouched on mount', async expect => {
	const dispose = mount(
		<>
			<div id="left" style={{ width: '100px', height: '50px' }} />
			<Splitter />
			<div id="right" style={{ width: '100px', height: '50px' }} />
		</>,
	)

	await microtask()

	const left = /** @type {HTMLDivElement} */ ($('#left'))
	// only the original inline `width: 100px` is present;
	// the splitter must not pre-write min/max width.
	expect(left.style.width).toBe('100px')
	expect(left.style.minWidth).toBe('')
	expect(left.style.maxWidth).toBe('')

	dispose()
})

// --- drag-driven resize ------------------------------------------------

await test('Splitter - data-dragging toggles on pointerdown / pointerup', async expect => {
	const dispose = mount(
		<>
			<div id="left" style={{ width: '100px', height: '50px' }} />
			<Splitter initial={100} />
			<div id="right" style={{ width: '100px', height: '50px' }} />
		</>,
	)

	await microtask()

	const handle = /** @type {HTMLDivElement} */ (
		$('[role=separator]')
	)
	stubCapture(handle)

	expect(handle.hasAttribute('data-dragging')).toBe(false)

	pointer('pointerdown', handle, 50, 50)
	expect(handle.hasAttribute('data-dragging')).toBe(true)

	pointer('pointerup', handle, 50, 50)
	expect(handle.hasAttribute('data-dragging')).toBe(false)

	dispose()
})

await test('Splitter - pointermove resizes prev sibling by delta (sign=+1)', async expect => {
	const dispose = mount(
		<>
			<div id="left" style={{ width: '100px', height: '50px' }} />
			<Splitter initial={100} />
			<div id="right" style={{ width: '100px', height: '50px' }} />
		</>,
	)

	await microtask()

	const handle = /** @type {HTMLDivElement} */ (
		$('[role=separator]')
	)
	const left = /** @type {HTMLDivElement} */ ($('#left'))
	stubCapture(handle)

	pointer('pointerdown', handle, 100, 0)
	pointer('pointermove', handle, 130, 0)

	// startSize=100, delta=+30, sign=+1 → 130
	expect(left.style.width).toBe('130px')
	expect(left.style.minWidth).toBe('130px')
	expect(left.style.maxWidth).toBe('130px')

	pointer('pointerup', handle, 130, 0)
	dispose()
})

await test('Splitter - target="next" inverts the drag sign', async expect => {
	const dispose = mount(
		<>
			<div id="left" style={{ width: '100px', height: '50px' }} />
			<Splitter initial={100} target="next" />
			<div id="right" style={{ width: '100px', height: '50px' }} />
		</>,
	)

	await microtask()

	const handle = /** @type {HTMLDivElement} */ (
		$('[role=separator]')
	)
	const right = /** @type {HTMLDivElement} */ ($('#right'))
	stubCapture(handle)

	pointer('pointerdown', handle, 100, 0)
	pointer('pointermove', handle, 130, 0)

	// startSize=100, delta=+30, sign=-1 → 70
	expect(right.style.width).toBe('70px')

	pointer('pointerup', handle, 130, 0)
	dispose()
})

await test('Splitter - horizontal drag uses clientY and resizes height', async expect => {
	const dispose = mount(
		<>
			<div id="top" style={{ width: '100px', height: '50px' }} />
			<Splitter orientation="horizontal" initial={50} />
			<div id="bot" style={{ width: '100px', height: '50px' }} />
		</>,
	)

	await microtask()

	const handle = /** @type {HTMLDivElement} */ (
		$('[role=separator]')
	)
	const top = /** @type {HTMLDivElement} */ ($('#top'))
	stubCapture(handle)

	pointer('pointerdown', handle, 0, 100)
	pointer('pointermove', handle, 0, 140)

	// initial set startSize=50 via style; offsetHeight at pointerdown
	// is 50, delta=+40 → 90
	expect(top.style.height).toBe('90px')

	pointer('pointerup', handle, 0, 140)
	dispose()
})

await test('Splitter - drag delta is measured from the pointerdown origin', async expect => {
	const dispose = mount(
		<>
			<div id="left" style={{ width: '100px', height: '50px' }} />
			<Splitter initial={100} />
			<div id="right" style={{ width: '100px', height: '50px' }} />
		</>,
	)

	await microtask()

	const handle = /** @type {HTMLDivElement} */ (
		$('[role=separator]')
	)
	const left = /** @type {HTMLDivElement} */ ($('#left'))
	stubCapture(handle)

	pointer('pointerdown', handle, 200, 0)
	pointer('pointermove', handle, 220, 0)
	expect(left.style.width).toBe('120px')
	pointer('pointermove', handle, 240, 0)
	expect(left.style.width).toBe('140px')
	pointer('pointermove', handle, 180, 0)
	// delta is from origin (200), not previous move
	expect(left.style.width).toBe('80px')

	pointer('pointerup', handle, 180, 0)
	dispose()
})

// --- clamping ----------------------------------------------------------

await test('Splitter - min clamps the resized width', async expect => {
	const dispose = mount(
		<>
			<div id="left" style={{ width: '100px', height: '50px' }} />
			<Splitter initial={100} min={80} />
			<div id="right" style={{ width: '100px', height: '50px' }} />
		</>,
	)

	await microtask()

	const handle = /** @type {HTMLDivElement} */ (
		$('[role=separator]')
	)
	const left = /** @type {HTMLDivElement} */ ($('#left'))
	stubCapture(handle)

	pointer('pointerdown', handle, 100, 0)
	pointer('pointermove', handle, 10, 0) // delta=-90 → 10, clamped to 80
	expect(left.style.width).toBe('80px')

	pointer('pointerup', handle, 10, 0)
	dispose()
})

await test('Splitter - max clamps the resized width', async expect => {
	const dispose = mount(
		<>
			<div id="left" style={{ width: '100px', height: '50px' }} />
			<Splitter initial={100} max={150} />
			<div id="right" style={{ width: '100px', height: '50px' }} />
		</>,
	)

	await microtask()

	const handle = /** @type {HTMLDivElement} */ (
		$('[role=separator]')
	)
	const left = /** @type {HTMLDivElement} */ ($('#left'))
	stubCapture(handle)

	pointer('pointerdown', handle, 100, 0)
	pointer('pointermove', handle, 500, 0) // delta=+400 → 500, clamped to 150
	expect(left.style.width).toBe('150px')

	pointer('pointerup', handle, 500, 0)
	dispose()
})

// --- persist via localStorage ------------------------------------------

await test('Splitter - persist writes the resolved size to localStorage on pointerup', async expect => {
	const key = 'pota-splitter-test-write-' + Math.random()

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
		stubCapture(handle)

		pointer('pointerdown', handle, 100, 0)
		pointer('pointermove', handle, 140, 0)

		// not saved until pointerup
		expect(localStorage.getItem(key)).toBe(null)

		pointer('pointerup', handle, 140, 0)

		expect(localStorage.getItem(key)).toBe('140')

		dispose()
	} finally {
		localStorage.removeItem(key)
	}
})

await test('Splitter - persist restores stored size on mount, overriding initial', async expect => {
	const key = 'pota-splitter-test-restore-' + Math.random()
	localStorage.setItem(key, '175')

	try {
		const dispose = mount(
			<>
				<div id="left" style={{ width: '100px', height: '50px' }} />
				<Splitter initial={100} persist={key} />
				<div id="right" style={{ width: '100px', height: '50px' }} />
			</>,
		)

		await microtask()

		const left = /** @type {HTMLDivElement} */ ($('#left'))
		expect(left.style.width).toBe('175px')

		dispose()
	} finally {
		localStorage.removeItem(key)
	}
})

await test('Splitter - persist falls back to initial when stored value is invalid', async expect => {
	const key = 'pota-splitter-test-invalid-' + Math.random()
	localStorage.setItem(key, 'not-a-number')

	try {
		const dispose = mount(
			<>
				<div id="left" style={{ width: '100px', height: '50px' }} />
				<Splitter initial={110} persist={key} />
				<div id="right" style={{ width: '100px', height: '50px' }} />
			</>,
		)

		await microtask()

		const left = /** @type {HTMLDivElement} */ ($('#left'))
		expect(left.style.width).toBe('110px')

		dispose()
	} finally {
		localStorage.removeItem(key)
	}
})

// --- body inline-style side effects ------------------------------------

await test('Splitter - drag sets and pointerup clears body user-select + cursor', async expect => {
	const dispose = mount(
		<>
			<div id="left" style={{ width: '100px', height: '50px' }} />
			<Splitter initial={100} />
			<div id="right" style={{ width: '100px', height: '50px' }} />
		</>,
	)

	await microtask()

	const handle = /** @type {HTMLDivElement} */ (
		$('[role=separator]')
	)
	stubCapture(handle)

	pointer('pointerdown', handle, 100, 0)
	expect(document.body.style.userSelect).toBe('none')
	expect(document.body.style.cursor).toBe('col-resize')

	pointer('pointerup', handle, 100, 0)
	expect(document.body.style.userSelect).toBe('')
	expect(document.body.style.cursor).toBe('')

	dispose()
})

await test('Splitter - horizontal drag sets row-resize cursor', async expect => {
	const dispose = mount(
		<>
			<div id="top" style={{ width: '100px', height: '50px' }} />
			<Splitter orientation="horizontal" initial={50} />
			<div id="bot" style={{ width: '100px', height: '50px' }} />
		</>,
	)

	await microtask()

	const handle = /** @type {HTMLDivElement} */ (
		$('[role=separator]')
	)
	stubCapture(handle)

	pointer('pointerdown', handle, 0, 0)
	expect(document.body.style.cursor).toBe('row-resize')

	pointer('pointerup', handle, 0, 0)
	expect(document.body.style.cursor).toBe('')

	dispose()
})

await test('Splitter - dispose mid-drag still clears body inline styles', async expect => {
	const dispose = mount(
		<>
			<div id="left" style={{ width: '100px', height: '50px' }} />
			<Splitter initial={100} />
			<div id="right" style={{ width: '100px', height: '50px' }} />
		</>,
	)

	await microtask()

	const handle = /** @type {HTMLDivElement} */ (
		$('[role=separator]')
	)
	stubCapture(handle)

	pointer('pointerdown', handle, 100, 0)
	expect(document.body.style.userSelect).toBe('none')

	// dispose without pointerup — cleanup must still reset body styles
	dispose()

	expect(document.body.style.userSelect).toBe('')
	expect(document.body.style.cursor).toBe('')
})
