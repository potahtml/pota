/** @jsxImportSource pota */

import { test } from '#test'

import { root } from 'pota'
import {
	documentSize,
	onDocumentSize,
	useDocumentSize,
} from 'pota/use/resize'

await test('resize - documentSize reads viewport dimensions', expect => {
	const value = documentSize()

	expect(typeof value.width).toBe('number')
	expect(typeof value.height).toBe('number')
})

await test('resize - emitter publishes updated document sizes on resize', expect => {
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
	root(dispose => {
		const size = useDocumentSize()
		onDocumentSize(value => {
			seen.push(value)
		})

		expect(size()).toEqual({ width: 320, height: 240 })

		nextWidth = 640
		nextHeight = 480
		window.dispatchEvent(new Event('resize'))

		expect(seen.at(-1)).toEqual({ width: 640, height: 480 })
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
