/** @jsxImportSource pota */
// BUG CONFIRMATION — documentation/improvements.md: "Functions inside
// `class` arrays throw". setClassList's array branch passes raw items
// to classList.add; a function stringifies with spaces and throws
// InvalidCharacterError. Inconsistent with attribute values, where
// withValue resolves array items. Asserts the CURRENT buggy behavior.

import { test, body } from '#test'
import { signal, render, catchError } from 'pota'

await test('CONFIRM - class={[fn]} throws InvalidCharacterError', expect => {
	const caught = []
	/** @type {unknown} */ let d = 'sentinel'

	catchError(
		() => {
			d = render(
				<div
					class={/** @type {string[]} */ (
						/** @type {unknown} */ (['a', () => 'b'])
					)}
				/>,
			)
		},
		err =>
			caught.push(err instanceof DOMException ? err.name : String(err)),
	)

	// BUG: the function is not resolved, classList.add() rejects it
	expect(caught).toEqual(['InvalidCharacterError'])
	expect(d).toBe(undefined)
	expect(body()).toBe('')
	// FIXED: expect(body()).toBe('<div class="a b"></div>')
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
