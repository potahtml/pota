/** @jsxImportSource pota */
// Tests for pota/use/fullscreen: requestFullscreen, exitFullscreen,
// toggleFullscreen, isFullscreen, useFullscreen/onFullscreen emitter,
// and use:fullscreen JSX directive.

import { $, microtask, test } from '#test'

import { render, root } from 'pota'
import {
	exitFullscreen,
	isFullscreen,
	onFullscreen,
	requestFullscreen,
	toggleFullscreen,
	useFullscreen,
} from 'pota/use/fullscreen'
import 'pota/use/fullscreen'

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

// --- isFullscreen returns null when nothing is in fullscreen --------------

await test('fullscreen - isFullscreen returns null when no element is fullscreen', expect => {
	const originalValue = Object.getOwnPropertyDescriptor(
		Document.prototype,
		'fullscreenElement',
	)

	Object.defineProperty(Document.prototype, 'fullscreenElement', {
		configurable: true,
		get() {
			return null
		},
	})

	expect(isFullscreen()).toBe(null)

	if (originalValue) {
		Object.defineProperty(
			Document.prototype,
			'fullscreenElement',
			originalValue,
		)
	}
})

// --- useFullscreen returns a signal that reflects the emitter ------------

await test('fullscreen - useFullscreen returns a signal accessor', expect => {
	root(dispose => {
		const value = useFullscreen()
		expect(typeof value).toBe('function')
		// initial value comes from isFullscreen()
		dispose()
	})
})

// --- onFullscreen fires on fullscreenchange ------------------------------

await test('fullscreen - onFullscreen callback fires on fullscreenchange events', async expect => {
	const originalValue = Object.getOwnPropertyDescriptor(
		Document.prototype,
		'fullscreenElement',
	)
	let current = null

	Object.defineProperty(Document.prototype, 'fullscreenElement', {
		configurable: true,
		get() {
			return current
		},
	})

	const seen = []

	await root(async dispose => {
		onFullscreen(value => {
			seen.push(value)
		})

		const el = document.createElement('section')
		current = el
		document.dispatchEvent(new Event('fullscreenchange'))

		await microtask()

		current = null
		document.dispatchEvent(new Event('fullscreenchange'))

		await microtask()

		dispose()
	})

	// Two state changes produce two notifications
	expect(seen.length >= 2).toBe(true)

	if (originalValue) {
		Object.defineProperty(
			Document.prototype,
			'fullscreenElement',
			originalValue,
		)
	}
})

// --- toggleFullscreen uses documentElement as default -------------------

await test('fullscreen - toggleFullscreen without argument uses the document element', async expect => {
	const originalValue = Object.getOwnPropertyDescriptor(
		Document.prototype,
		'fullscreenElement',
	)
	const originalRequest = document.documentElement.requestFullscreen
	let current = null
	let requestedOn

	Object.defineProperty(Document.prototype, 'fullscreenElement', {
		configurable: true,
		get() {
			return current
		},
	})

	document.documentElement.requestFullscreen = function () {
		requestedOn = this
		return Promise.resolve()
	}

	await toggleFullscreen()

	expect(requestedOn).toBe(document.documentElement)

	document.documentElement.requestFullscreen = originalRequest
	if (originalValue) {
		Object.defineProperty(
			Document.prototype,
			'fullscreenElement',
			originalValue,
		)
	}
})

// --- use:fullscreen JSX directive attaches a click handler ---------------

await test('fullscreen - use:fullscreen directive triggers fullscreen on click', async expect => {
	const original = document.documentElement.requestFullscreen
	const originalValue = Object.getOwnPropertyDescriptor(
		Document.prototype,
		'fullscreenElement',
	)
	let requestedOn = null
	let current = null

	Object.defineProperty(Document.prototype, 'fullscreenElement', {
		configurable: true,
		get() {
			return current
		},
	})

	const target = document.createElement('div')
	target.requestFullscreen = function () {
		requestedOn = this
		return Promise.resolve()
	}
	document.body.appendChild(target)

	const dispose = render(
		<button use:fullscreen={() => target}>Open</button>,
	)

	await microtask()

	$('button').click()

	expect(requestedOn).toBe(target)

	target.remove()
	dispose()

	document.documentElement.requestFullscreen = original
	if (originalValue) {
		Object.defineProperty(
			Document.prototype,
			'fullscreenElement',
			originalValue,
		)
	}
})
