/** @jsxImportSource pota */

import { macrotask, microtask, test, $ } from '#test'

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
/*
await test('fullscreen - emitter and jsx plugin react to fullscreen changes', async expect => {
	const target = document.createElement('div')
	target.textContent = 'click me to fullscreen'
	document.body.append(target)

	const seen = []
	await root(async disposeOwner => {
		const value = useFullscreen()
		onFullscreen(next => {
			console.log('next', next)
			seen.push(next)
		})

		const disposeNode = render(
			<button use:fullscreen={() => target}>Open</button>,
		)

		await microtask()

		$('button').click()

		await microtask()
		await macrotask()

		console.log(value()) // alue is null for whatever reason

		expect(value()).toBe(target)
		expect(seen.at(-1)).toBe(target)

		//disposeNode()
		//disposeOwner()
	})
})
*/
