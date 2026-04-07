/** @jsxImportSource pota */

// Tests for internal std.js utilities: toValues, toEntries,
// stringifySorted, withResolvers, entriesIncludingSymbols,
// flatToArray, getValue, optional, nothing, emptyArray, walkParents.
import { test } from '#test'

import {
	emptyArray,
	entriesIncludingSymbols,
	flatToArray,
	getValue,
	nothing,
	optional,
	stringifySorted,
	toEntries,
	toValues,
	walkParents,
	withResolvers,
} from '../../../src/lib/std.js'

await test('std - toValues returns arrays directly and values iterators for map-like objects', expect => {
	const array = ['a', 'b']
	const map = new Map([
		['x', 1],
		['y', 2],
	])
	const set = new Set(['first', 'second'])

	expect(toValues(array)).toBe(array)
	expect(Array.from(toValues(map))).toEqual([1, 2])
	expect(Array.from(toValues(set))).toEqual(['first', 'second'])
	expect(Array.from(toValues('hi'))).toEqual(['h', 'i'])
})

await test('std - toEntries prefers entries() when available and falls back to array-like iteration', expect => {
	const map = new Map([
		['a', 1],
		['b', 2],
	])

	expect(Array.from(toEntries(map))).toEqual([
		['a', 1],
		['b', 2],
	])
	expect(Array.from(toEntries('ab'))).toEqual(['a', 'b'])
})

await test('std - stringifySorted sorts object keys and array items consistently', expect => {
	expect(
		stringifySorted({
			b: 2,
			a: 1,
			list: [
				{ z: 2, a: 1 },
				{ c: 3, b: 2 },
			],
		}),
	).toBe(`{
  "a": 1,
  "b": 2,
  "list": [
    {
      "a": 1,
      "z": 2
    },
    {
      "b": 2,
      "c": 3
    }
  ]
}`)
})

await test('std - withResolvers creates externally controlled promises', async expect => {
	const deferred = withResolvers()
	let resolved

	deferred.promise.then(value => {
		resolved = value
	})
	deferred.resolve('done')

	await deferred.promise

	expect(resolved).toBe('done')
})

await test('std - entriesIncludingSymbols yields string and symbol keys', expect => {
	const key = Symbol('secret')
	const value = { plain: 1, [key]: 2 }

	expect(Array.from(entriesIncludingSymbols(value))).toEqual([
		['plain', 1],
		[key, 2],
	])
})

await test('std - flatToArray wraps scalars and deeply flattens arrays', expect => {
	expect(flatToArray('x')).toEqual(['x'])
	expect(flatToArray(['a', ['b', ['c']]])).toEqual(['a', 'b', 'c'])
})

await test('std - getValue unwraps nested functions recursively', expect => {
	expect(getValue(1)).toBe(1)
	expect(getValue(() => () => () => 'value')).toBe('value')
})

await test('std - optional treats undefined as true and unwraps function values', expect => {
	expect(optional(undefined)).toBe(true)
	expect(optional(false)).toBe(false)
	expect(optional(() => true)).toBe(true)
})

await test('std - nothing and emptyArray are frozen empty containers', expect => {
	expect(Object.isFrozen(nothing)).toBe(true)
	expect(Object.isFrozen(emptyArray)).toBe(true)
	expect(Array.isArray(emptyArray)).toBe(true)
	expect(Object.keys(nothing)).toEqual([])
	expect(emptyArray.length).toBe(0)
})

await test('std - walkParents traverses until callback succeeds', expect => {
	const seen = []
	const stopped = walkParents(
		{
			name: 'leaf',
			parent: {
				name: 'middle',
				parent: {
					name: 'root',
					parent: undefined,
				},
			},
		},
		'parent',
		value => {
			seen.push(value.name)
			return value.name === 'middle'
		},
	)

	expect(stopped).toBe(true)
	expect(seen).toEqual(['leaf', 'middle'])
})
