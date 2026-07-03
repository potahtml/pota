/** @jsxImportSource pota */
// REGRESSION — documentation/improvements.md: "Functions inside
// `class` arrays throw". setClassList's array branch used to pass raw
// items to classList.add; a function stringified with spaces and
// threw InvalidCharacterError. Fixed: array items resolve through
// withValue (functions tracked, promises awaited), consistent with
// attribute arrays.

import { test, body } from '#test'
import { signal, render } from 'pota'

await test('class={[fn]} resolves the function into a class name', expect => {
	const dispose = render(
		<div
			class={/** @type {string[]} */ (
				/** @type {unknown} */ (['a', () => 'b'])
			)}
		/>,
	)

	expect(body()).toBe('<div class="a b"></div>')

	dispose()
})

await test('reactive class array items update the class list', expect => {
	const active = signal(false)

	const dispose = render(
		<div
			class={/** @type {string[]} */ (
				/** @type {unknown} */ (['btn', () => active.read() && 'on'])
			)}
		/>,
	)

	// falsy resolved item is dropped
	expect(body()).toBe('<div class="btn"></div>')

	active.write(true)
	expect(body()).toBe('<div class="btn on"></div>')

	active.write(false)
	expect(body()).toBe('<div class="btn"></div>')

	dispose()
})

await test('control - string arrays and whole-value functions work', expect => {
	const dispose = render(<div class={['a', 'b']} />)
	expect(body()).toBe('<div class="a b"></div>')
	dispose()

	const s = signal('x')
	const dispose2 = render(<div class={s.read} />)
	expect(body()).toBe('<div class="x"></div>')
	s.write('y')
	expect(body()).toBe('<div class="y"></div>')
	dispose2()
})

await test('whole-value function swapping array to string cleans up', expect => {
	const value = signal(
		/** @type {unknown} */ (['a', () => 'b']),
	)

	const dispose = render(
		<div class={/** @type {string} */ (
			/** @type {unknown} */ (value.read)
		)} />,
	)
	expect(body()).toBe('<div class="a b"></div>')

	// swapping to a string removes the resolved array names
	value.write('solo')
	expect(body()).toBe('<div class="solo"></div>')

	dispose()
})
