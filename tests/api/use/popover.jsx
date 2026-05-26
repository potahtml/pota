/** @jsxImportSource pota */

import { $, microtask, test } from '#test'

import { render } from 'pota'
import { popover } from 'pota/use/popover'

const overlayWrap = () =>
	/** @type {HTMLElement | null} */ (
		document
			.querySelector('[role="dialog"].pota-overlay-panel')
			?.closest('.pota-overlay-wrap') ?? null
	)
const overlayInner = () =>
	/** @type {HTMLElement | null} */ (
		document.querySelector('[role="dialog"].pota-overlay-panel')
	)

const settle = async () => {
	await microtask()
	await microtask()
}

await test('popover - open / close toggles the overlay for the related node', async expect => {
	const dispose = render(
		<button id="anchor">anchor</button>,
		document.body,
	)
	const ui = popover()
	const anchor = $('#anchor')

	ui.setRelated(anchor)
	ui.setContent('  hello world  ')
	ui.open()
	await settle()

	expect(overlayWrap()?.style.display).toBe('block')
	expect(overlayInner()?.textContent).toBe('hello world')

	ui.close()
	await microtask()
	expect(overlayWrap()?.style.display).toBe('none')

	ui.dispose()
	dispose()
})

await test('popover - position and arrows are reflected on the panel', async expect => {
	const dispose = render(
		<button id="anchor">anchor</button>,
		document.body,
	)
	const ui = popover()

	ui.setRelated($('#anchor'))
	ui.setContent('confirm')
	ui.setPosition('right')
	ui.setArrows(false)
	ui.open()
	await settle()

	expect(overlayInner()?.getAttribute('data-overlay-position')).toBe(
		'right',
	)
	expect(overlayInner()?.getAttribute('data-overlay-arrows')).toBe(
		'false',
	)

	ui.dispose()
	dispose()
})

await test('popover - dispose removes the overlay from the DOM', async expect => {
	const dispose = render(
		<button id="anchor">anchor</button>,
		document.body,
	)
	const ui = popover()

	ui.setRelated($('#anchor'))
	ui.setContent('bye')
	ui.open()
	await settle()
	expect(overlayWrap()?.style.display).toBe('block')

	ui.dispose()
	await microtask()
	expect(overlayWrap()).toBe(null)

	dispose()
})

await test('popover - dispose is idempotent', async expect => {
	const dispose = render(
		<button id="anchor">anchor</button>,
		document.body,
	)
	const ui = popover()

	ui.setRelated($('#anchor'))
	ui.setContent('once')
	ui.open()
	await settle()

	ui.dispose()
	ui.dispose() // must not throw
	expect(overlayWrap()).toBe(null)

	dispose()
})

await test('popover - panel receives focus on open and restores it on close', async expect => {
	const dispose = render(
		<button id="anchor">anchor</button>,
		document.body,
	)
	const anchor = /** @type {HTMLButtonElement} */ ($('#anchor'))
	anchor.focus()
	expect(document.activeElement).toBe(anchor)

	const ui = popover()
	ui.setRelated(anchor)
	ui.setContent('focus me')
	ui.open()
	await settle()

	const panel = overlayInner()
	expect(panel?.getAttribute('tabindex')).toBe('-1')
	expect(document.activeElement).toBe(panel)

	ui.close()
	await microtask()
	expect(document.activeElement).toBe(anchor)

	ui.dispose()
	dispose()
})

await test('popover - position is clamped to the viewport', async expect => {
	// Anchor is positioned far off-screen; without clamping the wrap
	// would render past the viewport edge. The wrap's --overlay-x/y
	// must be within the visible window.
	const dispose = render(
		<button
			id="anchor"
			style={{
				position: 'fixed',
				left: '-200px',
				top: '-200px',
				width: '40px',
				height: '40px',
			}}
		>
			x
		</button>,
		document.body,
	)
	const ui = popover()
	ui.setRelated($('#anchor'))
	ui.setContent('clamped')
	ui.setPosition('top')
	ui.open()
	await settle()

	const wrap = overlayWrap()
	const x = parseFloat(
		wrap?.style.getPropertyValue('--overlay-x') || '0',
	)
	const y = parseFloat(
		wrap?.style.getPropertyValue('--overlay-y') || '0',
	)
	expect(x >= 0).toBe(true)
	expect(y >= 0).toBe(true)

	ui.dispose()
	dispose()
})
