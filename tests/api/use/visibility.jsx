/** @jsxImportSource pota */
// Tests for pota/use/visibility: isDocumentVisible,
// useDocumentVisible emitter, and onDocumentVisible callback.

import { microtask, test } from '#test'

import { root } from 'pota'
import {
	isDocumentVisible,
	onDocumentVisible,
	useDocumentVisible,
} from 'pota/use/visibility'

await test('visibility - visibility helpers reflect visibilitychange events', expect => {
	const descriptor = Object.getOwnPropertyDescriptor(
		Document.prototype,
		'visibilityState',
	)
	let state = 'visible'

	Object.defineProperty(Document.prototype, 'visibilityState', {
		configurable: true,
		get() {
			return state
		},
	})

	const seen = []
	const visible = useDocumentVisible()
	onDocumentVisible(value => {
		seen.push(value)
	})

	expect(isDocumentVisible()).toBe(true)
	expect(visible()).toBe(true)

	state = 'hidden'
	document.dispatchEvent(new Event('visibilitychange'))
	state = 'visible'
	document.dispatchEvent(new Event('visibilitychange'))

	expect(seen.slice(-2)).toEqual([false, true])

	if (descriptor) {
		Object.defineProperty(
			Document.prototype,
			'visibilityState',
			descriptor,
		)
	}
})

await test('visibility - isDocumentVisible returns boolean', expect => {
	const result = isDocumentVisible()
	expect(typeof result).toBe('boolean')
})

await test('visibility - useDocumentVisible returns a signal function', expect => {
	root(dispose => {
		const visible = useDocumentVisible()
		expect(typeof visible).toBe('function')
		expect(typeof visible()).toBe('boolean')
		dispose()
	})
})

// --- hidden state reflected via isDocumentVisible() ------------------

await test('visibility - isDocumentVisible reflects visibilityState of hidden', expect => {
	const descriptor = Object.getOwnPropertyDescriptor(
		Document.prototype,
		'visibilityState',
	)

	Object.defineProperty(Document.prototype, 'visibilityState', {
		configurable: true,
		get() {
			return 'hidden'
		},
	})

	expect(isDocumentVisible()).toBe(false)

	if (descriptor) {
		Object.defineProperty(
			Document.prototype,
			'visibilityState',
			descriptor,
		)
	}
})

// --- multiple consecutive state changes --------------------------------

await test('visibility - onDocumentVisible fires only once after many state changes', async expect => {
	const descriptor = Object.getOwnPropertyDescriptor(
		Document.prototype,
		'visibilityState',
	)
	let state = 'visible'

	Object.defineProperty(Document.prototype, 'visibilityState', {
		configurable: true,
		get() {
			return state
		},
	})

	const seen = []

	const dispose = await root(async dispose => {
		onDocumentVisible(value => seen.push(state))

		state = 'hidden'
		document.dispatchEvent(new Event('visibilitychange'))

		state = 'visible'
		document.dispatchEvent(new Event('visibilitychange'))

		state = 'hidden'
		document.dispatchEvent(new Event('visibilitychange'))

		return dispose
	})

	// three state changes, at least three notifications received
	expect(seen.length === 1).toBe(true)
	expect(seen[0]).toBe('hidden')

	if (descriptor) {
		Object.defineProperty(
			Document.prototype,
			'visibilityState',
			descriptor,
		)
	}

	dispose()
})
