/** @jsxImportSource pota */
// Tests for pota/use/focus: focusNext/focusPrevious wrap-around,
// useDocumentFocus emitter, and the autoFocus/selectOnFocus/trapFocus
// ref functions.

import { microtask, test, $ } from '#test'

import { render, root } from 'pota'
import {
	autoFocus,
	focusNext,
	focusPrevious,
	onDocumentFocus,
	selectOnFocus,
	trapFocus,
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

// --- scoped focusNext and focusPrevious ---------------------------------

await test('focus - focusNext with scoped elements only cycles within scope', expect => {
	const outside = document.createElement('input')
	const one = document.createElement('button')
	const two = document.createElement('input')

	document.body.append(outside, one, two)

	one.focus()
	focusNext([one, two])
	expect(document.activeElement).toBe(two)

	// wraps within scope, not to `outside`
	focusNext([one, two])
	expect(document.activeElement).toBe(one)

	outside.remove()
	one.remove()
	two.remove()
})

await test('focus - focusPrevious with scoped elements only cycles within scope', expect => {
	const outside = document.createElement('input')
	const one = document.createElement('button')
	const two = document.createElement('input')

	document.body.append(outside, one, two)

	two.focus()
	focusPrevious([one, two])
	expect(document.activeElement).toBe(one)

	// wraps within scope, not to `outside`
	focusPrevious([one, two])
	expect(document.activeElement).toBe(two)

	outside.remove()
	one.remove()
	two.remove()
})

// --- autoFocus -------------------------------------------------------

await test('focus - autoFocus focuses the element on mount', async expect => {
	const dispose = render(
		<input id="auto-focus" use:ref={autoFocus} />,
		document.body,
	)

	await microtask()

	expect(document.activeElement.id).toBe('auto-focus')

	dispose()
})

// --- selectOnFocus ---------------------------------------------------

await test('focus - selectOnFocus selects input contents when focused', async expect => {
	const dispose = render(
		<input id="select-on-focus" value="hello world" use:ref={selectOnFocus} />,
		document.body,
	)

	await microtask()

	const input = /** @type {HTMLInputElement} */ ($('#select-on-focus'))
	input.focus()
	input.dispatchEvent(new FocusEvent('focus', { bubbles: true }))

	expect(input.selectionStart).toBe(0)
	expect(input.selectionEnd).toBe('hello world'.length)

	dispose()
})

// --- trapFocus -------------------------------------------------------

await test('focus - trapFocus cycles Tab inside the element', async expect => {
	const dispose = render(
		<div id="trap" use:ref={trapFocus}>
			<input id="first" />
			<input id="middle" />
			<input id="last" />
		</div>,
		document.body,
	)

	await microtask()

	const trap = $('#trap')
	const last = $('#last')
	const first = $('#first')

	// Tab from last → first
	last.focus()
	trap.dispatchEvent(
		new KeyboardEvent('keydown', { bubbles: true, key: 'Tab' }),
	)
	expect(document.activeElement.id).toBe('first')

	// Shift+Tab from first → last
	first.focus()
	trap.dispatchEvent(
		new KeyboardEvent('keydown', {
			bubbles: true,
			key: 'Tab',
			shiftKey: true,
		}),
	)
	expect(document.activeElement.id).toBe('last')

	dispose()
})
