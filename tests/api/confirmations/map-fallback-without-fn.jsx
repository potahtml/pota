// REGRESSION — documentation/improvements.md: "`mapper()` with
// `fallback` but no `fn` crashes". map()'s empty path called
// `fn(fallback)` unconditionally, but only the renderer's <For>
// mount passes `fn` — direct map() usage with a fallback threw
// `TypeError: fn is not a function` when the list emptied.
// Fixed: without `fn` the mapper returns the fallback value itself
// (nothing was rendered, so there is nothing to diff away).

import { test } from '#test'
import { signal, map, effect, root, catchError } from 'pota'

await test('direct map() with fallback returns it on empty list', expect => {
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

	expect(caught).toEqual([])
	expect(results).toEqual(['fallback-value'])

	// leaving the empty state maps the items again
	items.write(['a'])
	expect(results.length).toBe(2)
	expect(results[1]).toEqual(['a'])

	// emptying again returns the fallback again
	items.write([])
	expect(results.length).toBe(3)
	expect(results[2]).toBe('fallback-value')
	expect(caught).toEqual([])

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
