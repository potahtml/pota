/** @jsxImportSource pota */

// Tests for non-element children — promises, Sets, Maps,
// DocumentFragments, and objects with custom `toString`.

import { $, macrotask, test } from '#test'
import { render } from 'pota'

// --- promise children --------------------------------------------------------

await test('children - promise as child renders when resolved', async expect => {
	const dispose = render(
		<div>{Promise.resolve('async text')}</div>,
	)

	await macrotask()

	expect($('div').textContent).toBe('async text')

	dispose()
})

// --- iterable children -------------------------------------------------------

await test('children - Set as child renders all values', expect => {
	const items = new Set(['a', 'b', 'c'])
	const dispose = render(
		<div>{items}</div>,
	)

	expect($('div').textContent).toBe('abc')

	dispose()
})

// --- object with toString as child -------------------------------------------

await test('children - object with toString renders its string representation', expect => {
	const obj = { toString: () => 'custom string' }
	const dispose = render(<div>{obj}</div>)

	expect($('div').textContent).toBe('custom string')

	dispose()
})

// --- null-prototype object as child ------------------------------------------

await test('children - null-prototype object with toString renders', expect => {
	const obj = Object.create(null)
	obj.toString = () => 'null-proto'
	const dispose = render(<div>{obj}</div>)

	expect($('div').textContent).toBe('null-proto')

	dispose()
})

// --- DocumentFragment as child -----------------------------------------------

await test('children - DocumentFragment child renders all its children', expect => {
	const frag = document.createDocumentFragment()
	frag.append(
		document.createElement('span'),
		document.createElement('b'),
	)
	frag.querySelector('span').textContent = 'a'
	frag.querySelector('b').textContent = 'b'

	const dispose = render(<div>{frag}</div>)

	expect($('div').innerHTML).toBe('<span>a</span><b>b</b>')

	dispose()
})

// --- Map as iterable children ----------------------------------------

await test('children - Map as child iterates its values', expect => {
	const items = new Map([
		['x', 'a'],
		['y', 'b'],
		['z', 'c'],
	])

	const dispose = render(<div>{items}</div>)

	// textContent includes all iterated values
	expect($('div').textContent).toInclude('a')
	expect($('div').textContent).toInclude('b')
	expect($('div').textContent).toInclude('c')

	dispose()
})
