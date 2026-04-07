/** @jsxImportSource pota */

import { test } from '#test'

import { root } from 'pota'
import { onOrientation, useOrientation } from 'pota/use/orientation'

await test('orientation - emitter derives horizontal and vertical from document size', expect => {
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
	root(dispose => {
		const orientation = useOrientation()
		onOrientation(value => {
			seen.push(value)
		})

		expect(orientation()).toBe('vertical')

		nextWidth = 800
		nextHeight = 200
		window.dispatchEvent(new Event('resize'))

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
