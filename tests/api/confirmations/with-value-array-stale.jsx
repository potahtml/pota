/** @jsxImportSource pota */
// BUG CONFIRMATION — documentation/improvements.md: "`withValue`
// array: terminal callback never re-fires". The `--pending === 0`
// counter in the array branch only hits zero once, so a reactive
// item updating later never re-dispatches the resolved array.
// Asserts the CURRENT buggy behavior; flip FIXED assertions on fix.

import { test, body } from '#test'
import { signal, withValue, root, render } from 'pota'

await test('CONFIRM - withValue array goes stale after first resolution', expect => {
	const s = signal('a')
	const calls = []

	const dispose = root(dispose => {
		withValue(['static', s.read], value => calls.push(value.slice()))
		return dispose
	})

	expect(calls).toEqual([['static', 'a']])

	// BUG: the item effect re-runs (see mutation test) but the
	// terminal callback never fires again — pending goes negative.
	s.write('b')
	expect(calls).toEqual([['static', 'a']])
	// FIXED: expect(calls).toEqual([['static', 'a'], ['static', 'b']])

	s.write('c')
	expect(calls).toEqual([['static', 'a']])
	// FIXED: expect(calls).toEqual([['static', 'a'], ['static', 'b'], ['static', 'c']])

	dispose()
})

await test('CONFIRM - attribute with a reactive array value never updates the DOM', expect => {
	const s = signal('one')

	const dispose = render(
		<div
			title={/** @type {string} */ (
				/** @type {unknown} */ (['id-', s.read])
			)}
		/>,
	)

	// the array resolves once and stringifies via setAttribute
	expect(body()).toBe('<div title="id-,one"></div>')

	// BUG: the DOM attribute is permanently stale
	s.write('two')
	expect(body()).toBe('<div title="id-,one"></div>')
	// FIXED: expect(body()).toBe('<div title="id-,two"></div>')

	dispose()
})
