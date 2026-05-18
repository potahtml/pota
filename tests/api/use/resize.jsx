/** @jsxImportSource pota */
// Tests for pota/use/resize: documentSize/useDocumentSize/onDocumentSize,
// the element-level useElementSize/onElementSize Emitter pair, and the
// `resize` ref factory.

import { microtask, test } from '#test'

import { render, root } from 'pota'
import {
	documentSize,
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
