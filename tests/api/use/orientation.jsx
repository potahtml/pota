/** @jsxImportSource pota */
// Tests for pota/use/orientation: useOrientation emitter derives
// horizontal/vertical from document size.

import { microtask, test } from '#test'

import { root } from 'pota'
import { onOrientation, useOrientation } from 'pota/use/orientation'

await test('orientation - emitter derives horizontal and vertical from document size', async expect => {
	const width = Object.getOwnPropertyDescriptor(
		document.documentElement,
		'clientWidth',
	)
	const height = Object.getOwnPropertyDescriptor(
		document.documentElement,
		'clientHeight',
	)
	let nextWidth = 300
	let nextHeight = 600

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
		const orientation = useOrientation()
		onOrientation(value => {
			seen.push(value)
		})

		expect(orientation()).toBe('vertical')

		nextWidth = 800
		nextHeight = 200
		window.dispatchEvent(new Event('resize'))

		await microtask()
		expect(seen.at(-1)).toBe('horizontal')
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

await test('orientation - square viewport reports horizontal', async expect => {
	const width = Object.getOwnPropertyDescriptor(
		document.documentElement,
		'clientWidth',
	)
	const height = Object.getOwnPropertyDescriptor(
		document.documentElement,
		'clientHeight',
	)

	Object.defineProperty(document.documentElement, 'clientWidth', {
		configurable: true,
		get() {
			return 500
		},
	})
	Object.defineProperty(document.documentElement, 'clientHeight', {
		configurable: true,
		get() {
			return 500
		},
	})

	await root(async dispose => {
		const orientation = useOrientation()
		// width >= height → horizontal
		expect(orientation()).toBe('horizontal')
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

// --- useOrientation returns a signal function --------------------------

await test('orientation - useOrientation returns a signal accessor', expect => {
	root(dispose => {
		const o = useOrientation()
		expect(typeof o).toBe('function')
		const value = o()
		expect(value === 'horizontal' || value === 'vertical').toBe(true)
		dispose()
	})
})

// --- transitioning from horizontal back to vertical -------------------

await test('orientation - transitions both ways horizontal ↔ vertical', async expect => {
	const width = Object.getOwnPropertyDescriptor(
		document.documentElement,
		'clientWidth',
	)
	const height = Object.getOwnPropertyDescriptor(
		document.documentElement,
		'clientHeight',
	)
	let w = 800
	let h = 400

	Object.defineProperty(document.documentElement, 'clientWidth', {
		configurable: true,
		get() {
			return w
		},
	})
	Object.defineProperty(document.documentElement, 'clientHeight', {
		configurable: true,
		get() {
			return h
		},
	})

	const seen = []

	await root(async dispose => {
		const o = useOrientation()
		onOrientation(value => seen.push(value))

		expect(o()).toBe('horizontal')

		// flip to vertical
		w = 400
		h = 800
		window.dispatchEvent(new Event('resize'))
		await microtask()

		expect(seen.at(-1)).toBe('vertical')

		// flip back to horizontal
		w = 900
		h = 500
		window.dispatchEvent(new Event('resize'))
		await microtask()

		expect(seen.at(-1)).toBe('horizontal')

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
