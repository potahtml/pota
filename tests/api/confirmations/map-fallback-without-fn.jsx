// BUG CONFIRMATION — documentation/improvements.md: "`mapper()` with
// `fallback` but no `fn` crashes". map()'s empty path calls
// `fn(fallback)` unconditionally; only <For>'s effect passes `fn`,
// so direct map() usage with a fallback throws when the list is
// empty. Asserts the CURRENT buggy behavior.

import { test } from '#test'
import { signal, map, effect, root, catchError } from 'pota'

await test('CONFIRM - direct map() with fallback throws on empty list', expect => {
	const items = signal([])
	const caught = []
	const results = []

	const dispose = /** @type {() => void} */ (
		catchError(
			() =>
				root(d => {
					const mapper = map(
						items.read,
						item => item,
						false,
						'fallback-value',
					)
					effect(() => results.push(mapper()))
					return d
				}),
			err => caught.push(err instanceof Error ? err.message : String(err)),
		)
	)

	// BUG: the fallback path calls fn(fallback) with fn === undefined
	expect(caught.length).toBe(1)
	expect(caught[0]).toInclude('is not a function')
	expect(results).toEqual([])
	// FIXED: expect(caught).toEqual([]) and the fallback is returned

	dispose()
})

await test('control - direct map() without fallback handles empty lists', expect => {
	const items = signal([])
	const results = []

	const dispose = root(d => {
		const mapper = map(items.read, item => item)
		effect(() => results.push(mapper()))
		return d
	})

	expect(results).toEqual([[]])

	items.write(['a'])
	expect(results.length).toBe(2)
	expect(results[1]).toEqual(['a'])

	dispose()
})
