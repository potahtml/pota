/** @jsxImportSource pota */
// REGRESSION — documentation/improvements.md: "`withValue` array:
// terminal callback never re-fires". The old `--pending === 0`
// counter only hit zero once, so a reactive item updating later never
// re-dispatched the resolved array. Fixed by per-item resolution into
// a copy: once every slot has resolved, any reactive item change
// re-fires the terminal callback with the updated copy.

import { test, body } from '#test'
import { signal, withValue, root, render } from 'pota'

await test('withValue array re-fires when a reactive item changes', expect => {
	const s = signal('a')
	const calls = []

	const dispose = root(dispose => {
		withValue(['static', s.read], value => calls.push(value.slice()))
		return dispose
	})

	expect(calls).toEqual([['static', 'a']])

	s.write('b')
	expect(calls).toEqual([
		['static', 'a'],
		['static', 'b'],
	])

	s.write('c')
	expect(calls).toEqual([
		['static', 'a'],
		['static', 'b'],
		['static', 'c'],
	])

	dispose()
})

await test('attribute with a reactive array value updates the DOM', expect => {
	const s = signal('one')

	const dispose = render(
		<div
			title={/** @type {string} */ (
				/** @type {unknown} */ (['id-', s.read])
			)}
		/>,
	)

	// the array resolves and stringifies via setAttribute
	expect(body()).toBe('<div title="id-,one"></div>')

	s.write('two')
	expect(body()).toBe('<div title="id-,two"></div>')

	dispose()
})
