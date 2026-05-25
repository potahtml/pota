/** @jsxImportSource pota */
// Tests for pota/use/resize: documentSize/useDocumentSize/onDocumentSize,
// the element-level useElementSize/onElementSize Emitter pair, the
// `resize` ref factory, and the `ensureInBounds` viewport clamp.

import { $, microtask, test } from '#test'

import { render, root } from 'pota'
import {
	documentSize,
	ensureInBounds,
	onDocumentSize,
	onElementSize,
	resize,
	useDocumentSize,
	useElementSize,
} from 'pota/use/resize'

await test('resize - documentSize reads viewport dimensions', expect => {
	const value = documentSize()

	expect(typeof value.width).toBe('number')
	expect(typeof value.height).toBe('number')
})

await test('resize - emitter publishes updated document sizes on resize', async expect => {
	const width = Object.getOwnPropertyDescriptor(
		document.documentElement,
		'clientWidth',
	)
	const height = Object.getOwnPropertyDescriptor(
		document.documentElement,
		'clientHeight',
	)
	let nextWidth = 320
	let nextHeight = 240

	Object.defineProperty(document.documentElement, 'clientWidth', {
		configurable: true,
		get() {
			return nextWidth
		},
	})
	Object.defineProperty(document.documentElement, 'clientHeight', {
		configurable: true,
		get() {
			return nextHeight
		},
	})

	const seen = []
	await root(async dispose => {
		const size = useDocumentSize()
		onDocumentSize(value => {
			seen.push(value)
		})

		expect(size()).toEqual({ width: 320, height: 240 })

		nextWidth = 640
		nextHeight = 480
		window.dispatchEvent(new Event('resize'))

		await microtask()

		expect(seen.at(-1)).toEqual({ width: 640, height: 480 })
		dispose()
	})

	width
		? Object.defineProperty(
				document.documentElement,
				'clientWidth',
				width,
			)
		: delete (
				/** @type {any} */ (document.documentElement).clientWidth
			)
	height
		? Object.defineProperty(
				document.documentElement,
				'clientHeight',
				height,
			)
		: delete (
				/** @type {any} */ (document.documentElement).clientHeight
			)
})

await test('resize - useDocumentSize returns a signal function', expect => {
	root(dispose => {
		const size = useDocumentSize()
		expect(typeof size).toBe('function')
		const value = size()
		expect('width' in value).toBe(true)
		expect('height' in value).toBe(true)
		dispose()
	})
})

await test('resize - onDocumentSize receives updates on multiple resizes', async expect => {
	const seen = []

	await root(async dispose => {
		onDocumentSize(value => {
			seen.push(value)
		})

		// baseline: no events yet
		expect(seen).toEqual([])

		window.dispatchEvent(new Event('resize'))
		await microtask()
		window.dispatchEvent(new Event('resize'))
		await microtask()

		expect(seen.length >= 2).toBe(true)
		dispose()
	})
})

// --- multiple subscribers share a single resize listener --------------

await test('resize - multiple useDocumentSize calls share one subscription', async expect => {
	await root(async dispose => {
		const a = useDocumentSize()
		const b = useDocumentSize()
		const c = useDocumentSize()

		// all three return callable signal accessors
		expect(typeof a).toBe('function')
		expect(typeof b).toBe('function')
		expect(typeof c).toBe('function')

		// they all observe the same value
		expect(a()).toEqual(b())
		expect(b()).toEqual(c())

		dispose()
	})
})

// --- resize events outside of an active owner are still delivered ----

await test('resize - resize dispatches do not throw outside an owner', expect => {
	expect(() =>
		window.dispatchEvent(new Event('resize')),
	).not.toThrow()
})

// --- element-level resize (ResizeObserver) ---------------------------

const waitForObserver = () =>
	new Promise(r =>
		requestAnimationFrame(() => requestAnimationFrame(r)),
	)

await test('resize - useElementSize returns a signal accessor', async expect => {
	const node = document.createElement('div')
	document.body.appendChild(node)

	await root(async dispose => {
		const size = useElementSize(node)
		expect(typeof size).toBe('function')

		await waitForObserver()

		const value = size()
		expect(value === undefined || 'contentRect' in value).toBe(true)

		dispose()
	})

	node.remove()
})

await test('resize - onElementSize fires for element resize', async expect => {
	const node = document.createElement('div')
	document.body.appendChild(node)

	const seen = []
	await root(async dispose => {
		onElementSize(node, entry => seen.push(entry))

		await waitForObserver()
		await microtask()

		expect(seen.length >= 1).toBe(true)
		expect('contentRect' in seen[seen.length - 1]).toBe(true)

		dispose()
	})

	node.remove()
})

await test('resize - resize ref factory wires onElementSize', async expect => {
	const seen = []

	const dispose = render(
		<div use:ref={resize(entry => seen.push(entry))} />,
		document.body,
	)

	await microtask()
	await waitForObserver()
	await microtask()

	expect(seen.length >= 1).toBe(true)

	dispose()
})

// --- ensureInBounds -------------------------------------------------

await test('resize - ensureInBounds clamps max-width / max-height to viewport', async expect => {
	const widthDesc = Object.getOwnPropertyDescriptor(
		document.documentElement,
		'clientWidth',
	)
	const heightDesc = Object.getOwnPropertyDescriptor(
		document.documentElement,
		'clientHeight',
	)
	let nextW = 1000
	let nextH = 800
	Object.defineProperty(document.documentElement, 'clientWidth', {
		configurable: true,
		get() {
			return nextW
		},
	})
	Object.defineProperty(document.documentElement, 'clientHeight', {
		configurable: true,
		get() {
			return nextH
		},
	})

	try {
		const dispose = render(
			<div
				id="panel"
				style="position: fixed; left: 100px; top: 200px; width: 300px; height: 150px;"
				use:ref={ensureInBounds}
			/>,
			document.body,
		)
		// onMount runs after the next microtask flush; yield twice so
		// the rect snapshot + clamp effect have run.
		await microtask()
		await microtask()

		const panel = $('#panel')
		// element rect: 100,200 → 400,350. viewport: 1000x800 → no clamp.
		expect(panel.style.maxWidth).toBe('')
		expect(panel.style.maxHeight).toBe('')

		// shrink width so the element overflows horizontally
		nextW = 350
		window.dispatchEvent(new Event('resize'))
		await microtask()
		expect(panel.style.maxWidth).toBe('250px') // 350 - rect.left(100)

		// shrink height so the element overflows vertically
		nextH = 300
		window.dispatchEvent(new Event('resize'))
		await microtask()
		expect(panel.style.maxHeight).toBe('100px') // 300 - rect.top(200)

		// expand back: the clamps lift
		nextW = 1000
		nextH = 800
		window.dispatchEvent(new Event('resize'))
		await microtask()
		expect(panel.style.maxWidth).toBe('')
		expect(panel.style.maxHeight).toBe('')

		dispose()
	} finally {
		if (widthDesc) {
			Object.defineProperty(
				document.documentElement,
				'clientWidth',
				widthDesc,
			)
		}
		if (heightDesc) {
			Object.defineProperty(
				document.documentElement,
				'clientHeight',
				heightDesc,
			)
		}
	}
})
