/** @jsxImportSource pota */

import { test } from '#test'

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
