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
		: delete document.documentElement.clientWidth
	height
		? Object.defineProperty(
				document.documentElement,
				'clientHeight',
				height,
			)
		: delete document.documentElement.clientHeight
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
		: delete document.documentElement.clientWidth
	height
		? Object.defineProperty(
				document.documentElement,
				'clientHeight',
				height,
			)
		: delete document.documentElement.clientHeight
})
