/** @jsxImportSource pota */
// Tests for pota/use/tooltip: the singleton overlay, ref factory
// show/hide on hover + focus, content swap when a different
// trigger activates, hide on trigger scope dispose, and basic
// position attribute wiring. Actual coordinate math is browser-
// dependent so we assert structural state (visible, attribute set,
// content present), not exact x/y.

import { $, microtask, sleep, test } from '#test'

import { render, signal } from 'pota'
import { tooltip } from 'pota/use/tooltip'

const pointer = (type, target) =>
	target.dispatchEvent(new PointerEvent(type, { bubbles: true }))

const overlayWrap = () =>
	/** @type {HTMLElement | null} */ (
		document.querySelector('[role="tooltip"]')?.parentElement ?? null
	)
const overlayInner = () =>
	/** @type {HTMLElement | null} */ (
		document.querySelector('[role="tooltip"]')
	)
// position update is queued in a microtask after layout — yield
// twice so reactive setup + position queue both flush.
const settle = async () => {
	await microtask()
	await microtask()
}

await test('tooltip - pointerenter shows the overlay with the given content', async expect => {
	const dispose = render(
		<button id="t1" use:ref={tooltip({ content: 'help text' })}>
			hover me
		</button>,
		document.body,
	)
	await microtask()

	expect(overlayWrap()?.style.display).toBe('none')

	pointer('pointerenter', $('#t1'))
	await settle()

	expect(overlayWrap()?.style.display).toBe('block')
	expect(overlayInner()?.textContent).toBe('help text')

	pointer('pointerleave', $('#t1'))
	await microtask()
	expect(overlayWrap()?.style.display).toBe('none')

	dispose()
})

await test('tooltip - focus / blur drive the same show / hide path', async expect => {
	const dispose = render(
		<button id="t2" use:ref={tooltip({ content: 'a11y' })}>
			focus me
		</button>,
		document.body,
	)
	await microtask()

	const btn = /** @type {HTMLElement} */ ($('#t2'))
	btn.dispatchEvent(new FocusEvent('focus', { bubbles: false }))
	await settle()

	expect(overlayWrap()?.style.display).toBe('block')
	expect(overlayInner()?.textContent).toBe('a11y')

	btn.dispatchEvent(new FocusEvent('blur', { bubbles: false }))
	await microtask()
	expect(overlayWrap()?.style.display).toBe('none')

	dispose()
})

await test('tooltip - position prop is reflected on the inner element', async expect => {
	const dispose = render(
		<button
			id="t3"
			use:ref={tooltip({ content: 'pos', position: 'right' })}
		>
			x
		</button>,
		document.body,
	)
	await microtask()

	pointer('pointerenter', $('#t3'))
	await settle()

	expect(overlayInner()?.getAttribute('data-overlay-position')).toBe(
		'right',
	)

	pointer('pointerleave', $('#t3'))
	dispose()
})

await test('tooltip - arrows: false disables the arrow indicator attr', async expect => {
	const dispose = render(
		<button
			id="t4"
			use:ref={tooltip({ content: 'noarr', arrows: false })}
		>
			x
		</button>,
		document.body,
	)
	await microtask()

	pointer('pointerenter', $('#t4'))
	await settle()

	expect(overlayInner()?.getAttribute('data-overlay-arrows')).toBe(
		'false',
	)

	pointer('pointerleave', $('#t4'))
	dispose()
})

await test('tooltip - activating a different trigger swaps content', async expect => {
	const dispose = render(
		<div>
			<button id="a" use:ref={tooltip({ content: 'first' })}>a</button>
			<button id="b" use:ref={tooltip({ content: 'second' })}>b</button>
		</div>,
		document.body,
	)
	await microtask()

	pointer('pointerenter', $('#a'))
	await settle()
	expect(overlayInner()?.textContent).toBe('first')

	// move pointer over to b: leave a (hides), then enter b (shows)
	pointer('pointerleave', $('#a'))
	pointer('pointerenter', $('#b'))
	await settle()

	expect(overlayWrap()?.style.display).toBe('block')
	expect(overlayInner()?.textContent).toBe('second')

	pointer('pointerleave', $('#b'))
	dispose()
})

await test('tooltip - reactive content updates while shown', async expect => {
	const value = signal('one')
	const dispose = render(
		<button id="r" use:ref={tooltip({ content: value.read })}>x</button>,
		document.body,
	)
	await microtask()

	pointer('pointerenter', $('#r'))
	await settle()
	expect(overlayInner()?.textContent).toBe('one')

	value.write('two')
	await settle()
	expect(overlayInner()?.textContent).toBe('two')

	pointer('pointerleave', $('#r'))
	dispose()
})

await test('tooltip - disposing the last trigger removes the singleton overlay', async expect => {
	const dispose = render(
		<button id="d" use:ref={tooltip({ content: 'bye' })}>x</button>,
		document.body,
	)
	await microtask()

	pointer('pointerenter', $('#d'))
	await settle()
	expect(overlayWrap()?.style.display).toBe('block')

	dispose()
	await microtask()
	// refcounted singleton: with the last consumer gone, the
	// overlay element is removed from the DOM entirely.
	expect(overlayWrap()).toBe(null)
})

await test('tooltip - blur on a non-active trigger does not hide the active one', async expect => {
	// Reproduces: focus B (B shows), pointerenter on A (A shows),
	// then blur on B should NOT close A's tooltip.
	const dispose = render(
		<div>
			<button id="x" use:ref={tooltip({ content: 'x' })}>x</button>
			<button id="y" use:ref={tooltip({ content: 'y' })}>y</button>
		</div>,
		document.body,
	)
	await microtask()

	$('#y').dispatchEvent(new FocusEvent('focus'))
	await settle()
	expect(overlayInner()?.textContent).toBe('y')

	pointer('pointerenter', $('#x'))
	await settle()
	expect(overlayInner()?.textContent).toBe('x')

	// blur on Y — y is NOT the active trigger anymore, so this
	// must be a no-op for visibility.
	$('#y').dispatchEvent(new FocusEvent('blur'))
	await microtask()
	expect(overlayWrap()?.style.display).toBe('block')
	expect(overlayInner()?.textContent).toBe('x')

	pointer('pointerleave', $('#x'))
	dispose()
})
