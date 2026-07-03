/** @jsxImportSource pota */
// REGRESSION — documentation/improvements.md: "array search and
// positional reads undertrack". `slice` subscribed only to the key
// range (growth appended keys it never saw); `indexOf`/`lastIndexOf`
// tracked only the found slot (nothing at all on a miss, and an
// earlier occurrence appearing went unseen); `at`/`with` resolved
// negative indices against `length` without tracking it, and `with`
// tracked one slot though its result copies the whole array. Fixed:
// `slice` also reads `length`; the search methods and `with` use the
// coarse `valuesRead`; `at` tracks `length` for negative/missing
// indices and the undefined-state for absent slots.

import { test } from '#test'
import { root, syncEffect } from 'pota'
import { mutable } from 'pota/store'

await test('slice() re-runs when the array grows', expect => {
	const state = mutable({ list: [1, 2] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.list.slice().length)
		})
	})

	expect(seen).toEqual([2])

	state.list.push(3)
	expect(seen).toEqual([2, 3])

	state.list.length = 1
	expect(seen).toEqual([2, 3, 1])
})

await test('indexOf miss re-runs when the element is added later', expect => {
	const state = mutable({ list: ['a'] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.list.indexOf('b'))
		})
	})

	expect(seen).toEqual([-1])

	state.list.push('b')
	expect(seen).toEqual([-1, 1])
})

await test('indexOf sees an earlier occurrence appearing', expect => {
	const state = mutable({ list: ['x', 'a'] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.list.indexOf('a'))
		})
	})

	expect(seen).toEqual([1])

	state.list[0] = 'a'
	expect(seen).toEqual([1, 0])
})

await test('lastIndexOf miss re-runs when the element is added later', expect => {
	const state = mutable({ list: ['a'] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.list.lastIndexOf('b'))
		})
	})

	expect(seen).toEqual([-1])

	state.list.unshift('b')
	expect(seen).toEqual([-1, 0])
})

await test('at(-1) tracks length', expect => {
	const state = mutable({ list: [1, 2] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.list.at(-1))
		})
	})

	expect(seen).toEqual([2])

	state.list.push(3)
	expect(seen).toEqual([2, 3])

	state.list.pop()
	expect(seen).toEqual([2, 3, 2])
})

await test('at() out of range re-runs when the slot appears', expect => {
	const state = mutable({ list: [1] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.list.at(2))
		})
	})

	expect(seen).toEqual([undefined])

	state.list.push(2, 3)
	expect(seen).toEqual([undefined, 3])
})

await test('with() re-runs when untouched slots change', expect => {
	const state = mutable({ list: ['a', 'b'] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.list.with(0, 'X').join(''))
		})
	})

	expect(seen).toEqual(['Xb'])

	state.list[1] = 'c'
	expect(seen).toEqual(['Xb', 'Xc'])
})
