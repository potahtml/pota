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

const settle = async () => {
	await microtask()
	await microtask()
}

// Covers the `if (disposed) return` guard in `open()` (popover.js:61):
// calling open() after dispose() must be a no-op — it must not write
// `opened` true nor resurrect any overlay panel in the DOM.
await test('popover - open() after dispose is a no-op', async expect => {
	const dispose = render(
		<button id="anchor">anchor</button>,
		document.body,
	)
	const ui = popover()

	ui.setRelated($('#anchor'))
	ui.setContent('after dispose')

	// dispose before ever opening, then attempt to open
	ui.dispose()
	await microtask()

	// guard short-circuits: no throw, no overlay created
	ui.open()
	await settle()

	expect(overlayWrap()).toBe(null)

	dispose()
})

// Same guard, but after the overlay has been opened and torn down:
// re-opening a disposed controller must not bring the panel back.
await test('popover - open() after open + dispose does not reopen', async expect => {
	const dispose = render(
		<button id="anchor">anchor</button>,
		document.body,
	)
	const ui = popover()

	ui.setRelated($('#anchor'))
	ui.setContent('reopen me')
	ui.open()
	await settle()
	expect(overlayWrap()?.style.display).toBe('block')

	ui.dispose()
	await microtask()
	expect(overlayWrap()).toBe(null)

	// disposed: open() returns early, overlay stays gone
	ui.open()
	await settle()
	expect(overlayWrap()).toBe(null)

	dispose()
})
