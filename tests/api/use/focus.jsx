/** @jsxImportSource pota */
// Tests for pota/use/focus: focusNext/focusPrevious wrap-around,
// and useDocumentFocus emitter.

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

await test('focus - document focus emitter reflects blur and focus events', async expect => {
	const seen = []

	await root(async dispose => {
		const value = useDocumentFocus()
		onDocumentFocus(next => {
			seen.push(next)
		})

		// baseline: value is a boolean signal, no events dispatched yet
		expect(typeof value()).toBe('boolean')
		expect(seen).toEqual([])

		window.dispatchEvent(new FocusEvent('blur'))

		await microtask()

		window.dispatchEvent(new FocusEvent('focus'))

		await microtask()

		expect(seen.slice(-2)).toEqual([false, true])
		dispose()
	})
})

await test('focus - focusNext wraps around from last to first element', expect => {
	const one = document.createElement('input')
	const two = document.createElement('button')

	document.body.append(one, two)

	two.focus()
	expect(document.activeElement).toBe(two)

	focusNext()
	// should wrap to first tabbable
	expect(document.activeElement).toBe(one)

	one.remove()
	two.remove()
})

await test('focus - focusPrevious wraps around from first to last element', expect => {
	const one = document.createElement('input')
	const two = document.createElement('button')

	document.body.append(one, two)

	one.focus()
	expect(document.activeElement).toBe(one)

	focusPrevious()
	// should wrap to last tabbable
	expect(document.activeElement).toBe(two)

	one.remove()
	two.remove()
})

// --- focusNext skips disabled elements ----------------------------------

await test('focus - focusNext skips disabled inputs', expect => {
	const one = document.createElement('input')
	const two = document.createElement('input')
	two.disabled = true
	const three = document.createElement('input')

	document.body.append(one, two, three)

	one.focus()
	focusNext()

	// should land on `three`, not the disabled `two`
	expect(document.activeElement).toBe(three)

	one.remove()
	two.remove()
	three.remove()
})

// --- focusNext when no tabbable elements exist is a no-op --------------

await test('focus - focusNext with no tabbable elements does nothing', expect => {
	const originalActive = document.activeElement

	// no tabbable elements added
	expect(() => focusNext()).not.toThrow()

	// active element unchanged
	expect(document.activeElement).toBe(originalActive)
})

// --- single element wraps to itself ------------------------------------

await test('focus - focusNext with a single tabbable element focuses it again', expect => {
	const only = document.createElement('input')

	document.body.append(only)

	only.focus()
	focusNext()

	// Only one element: cycling lands back on the same element
	expect(document.activeElement).toBe(only)

	only.remove()
})
