/** @jsxImportSource pota */

// Tests for `map()` — fallback rendering, duplicate primitives,
// reactive index. Used as the iteration primitive behind For.

import { test, body } from '#test'
import { signal, map, root, render } from 'pota'

// --- map fallback ------------------------------------------------------------

/*
await test('map - renders fallback when list is empty and clears it when items arrive', expect => {
	const items = signal([])

	const dispose = render(
		<>{map(items.read, item => <p>{item}</p>, false, <b>empty</b>)}</>,
	)

	expect(body()).toBe('<b>empty</b>')

	items.write(['a'])
	expect(body()).toBe('<p>a</p>')

	items.write([])
	expect(body()).toBe('<b>empty</b>')

	dispose()
})
*/

// --- map duplicates ----------------------------------------------------------

await test('map - handles duplicate primitive values', expect => {
	const items = signal([1, 1, 1])
	/** @type {any} */
	let nodes

	root(() => {
		const mapper = map(items.read, item => item)
		nodes = mapper()
	})

	expect(nodes.length).toBe(3)
})

// --- map reactive index ------------------------------------------------------

await test('map - reactive index updates when items reorder', expect => {
	const items = signal(['a', 'b', 'c'])
	const indices = []

	root(() => {
		const mapper = map(
			items.read,
			(item, index) => {
				indices.push({ item, index: index() })
				return item
			},
			false,
			undefined,
			true,
		)
		mapper()
	})

	expect(indices).toEqual([
		{ item: 'a', index: 0 },
		{ item: 'b', index: 1 },
		{ item: 'c', index: 2 },
	])
})
