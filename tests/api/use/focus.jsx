/** @jsxImportSource pota */

import { microtask, test } from '#test'

import { root } from 'pota'
import {
	focusNext,
	focusPrevious,
	onDocumentFocus,
	useDocumentFocus,
} from 'pota/use/focus'

await test('focus - focusNext and focusPrevious cycle through tabbable elements', expect => {
	const one = document.createElement('input')
	const two = document.createElement('button')
	const three = document.createElement('textarea')

	document.body.append(one, two, three)

	one.focus()
	focusNext()
	expect(document.activeElement).toBe(two)

	focusNext()
	expect(document.activeElement).toBe(three)

	focusPrevious()
	expect(document.activeElement).toBe(two)

	one.remove()
	two.remove()
	three.remove()
})

await test('focus - document focus emitter reflects blur and focus events', expect => {
	const seen = []

	root(async dispose => {
		const value = useDocumentFocus()
		onDocumentFocus(next => {
			seen.push(next)
		})

		expect(typeof value()).toBe('boolean')

		window.dispatchEvent(new FocusEvent('blur'))

		await microtask()

		window.dispatchEvent(new FocusEvent('focus'))

		await microtask()

		expect(seen.slice(-2)).toEqual([false, true])
		dispose()
	})
})
