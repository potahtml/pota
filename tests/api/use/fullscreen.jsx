/** @jsxImportSource pota */
// Tests for pota/use/fullscreen: requestFullscreen, exitFullscreen,
// toggleFullscreen, and isFullscreen.

import { test } from '#test'

import { render, root } from 'pota'
import {
	exitFullscreen,
	isFullscreen,
	onFullscreen,
	requestFullscreen,
	toggleFullscreen,
	useFullscreen,
} from 'pota/use/fullscreen'

await test('fullscreen - request, exit and toggle delegate to the platform methods', async expect => {
	const element = document.createElement('div')
	const originalExit = document.exitFullscreen
	const originalValue = Object.getOwnPropertyDescriptor(
		Document.prototype,
		'fullscreenElement',
	)
	let fullscreenElement = null
	let requested = 0
	let exited = 0

	Object.defineProperty(Document.prototype, 'fullscreenElement', {
		configurable: true,
		get() {
			return fullscreenElement
		},
	})
	document.exitFullscreen = () => {
		exited++
		fullscreenElement = null
		return Promise.resolve()
	}
	element.requestFullscreen = () => {
		requested++
		fullscreenElement = element
		return Promise.resolve()
	}

	await requestFullscreen(element)
	expect(isFullscreen()).toBe(element)

	toggleFullscreen(element)
	expect(exited).toBe(1)

	toggleFullscreen(element)
	expect(requested).toBe(2)

	await exitFullscreen()
	expect(isFullscreen()).toBe(null)

	document.exitFullscreen = originalExit
	if (originalValue) {
		Object.defineProperty(
			Document.prototype,
			'fullscreenElement',
			originalValue,
		)
	}
})
