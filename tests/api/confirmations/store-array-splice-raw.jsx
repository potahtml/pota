/** @jsxImportSource pota */
// REGRESSION — documentation/improvements.md: "`splice` stores raw
// values". The handler wrapped inserted items into a discarded local
// (`items = args.slice(2).map(mutable)`) and applied the original
// raw `args` — breaking the stored-proxies invariant every other
// write path keeps, so identity lookups (`indexOf`, `includes`)
// missed spliced-in items. Fixed: `args` items are wrapped in place,
// like `toSpliced` does.

import { test } from '#test'
import { root, syncEffect } from 'pota'
import { mutable } from 'pota/store'

await test('splice-inserted objects are found by identity lookups', expect => {
	const state = mutable({ list: [] })
	const obj = { a: 1 }

	state.list.splice(0, 0, obj)

	expect(state.list.indexOf(state.list[0])).toBe(0)
	expect(state.list.includes(state.list[0])).toBe(true)

	// same raw, same proxy — matches the push path
	const viaPush = mutable({ list: [] })
	viaPush.list.push(obj)
	expect(viaPush.list[0]).toBe(state.list[0])
})

await test('splice-inserted nested arrays are reactive through iteration', expect => {
	const state = mutable({ list: [] })
	state.list.splice(0, 0, ['nested'])

	let runs = 0
	root(() => {
		syncEffect(() => {
			runs++
			for (const item of state.list) {
				item.length
			}
		})
	})

	expect(runs).toBe(1)

	// mutate through the reference the iteration yielded
	state.list[0].push('more')
	expect(runs).toBe(2)
})
