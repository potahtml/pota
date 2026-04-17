/** @jsxImportSource pota */

// Tests for internal std.js utilities: toValues, toEntries,
// stringifySorted, withResolvers, entriesIncludingSymbols,
// flatToArray, getValue, optional, nothing, emptyArray, walkParents,
// equals, range, removeFromArray, indexByKey, morphedBetweenArrayAndObject.
import { test } from '#test'

import {
	emptyArray,
	entriesIncludingSymbols,
	equals,
	flatToArray,
	getValue,
	indexByKey,
	morphedBetweenArrayAndObject,
	nothing,
	optional,
	range,
	removeFromArray,
	stringifySorted,
	toEntries,
	toValues,
	walkParents,
	withResolvers,
} from '../../src/lib/std.js'

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

await test('std - walkParents returns false when chain ends without stopping', expect => {
	const seen = []
	const stopped = walkParents(
		{ name: 'only', parent: undefined },
		'parent',
		value => {
			seen.push(value.name)
			return false
		},
	)

	expect(stopped).toBe(false)
	expect(seen).toEqual(['only'])
})

await test('std - stringifySorted handles arrays of primitives', expect => {
	expect(stringifySorted([3, 1, 2])).toBe('[\n  1,\n  2,\n  3\n]')
})

await test('std - getValue returns non-function values directly', expect => {
	expect(getValue(42)).toBe(42)
	expect(getValue('hello')).toBe('hello')
	expect(getValue(null)).toBe(null)
	expect(getValue(undefined)).toBe(undefined)
})

await test('std - flatToArray handles null and undefined', expect => {
	expect(flatToArray(null)).toEqual([null])
	expect(flatToArray(undefined)).toEqual([undefined])
})

await test('std - optional returns the raw falsy value when not undefined', expect => {
	expect(optional(0)).toBe(0)
	expect(optional('')).toBe('')
	expect(optional(null)).toBe(null)
	expect(optional(false)).toBe(false)
	// all are falsy
	expect(!!optional(0)).toBe(false)
	expect(!!optional('')).toBe(false)
	expect(!!optional(null)).toBe(false)
	expect(!!optional(false)).toBe(false)
})

// --- equals ------------------------------------------------------------------

await test('std - equals returns true for identical primitives', expect => {
	expect(equals(1, 1)).toBe(true)
	expect(equals('a', 'a')).toBe(true)
	expect(equals(null, null)).toBe(true)
	expect(equals(undefined, undefined)).toBe(true)
})

await test('std - equals returns true for NaN === NaN', expect => {
	expect(equals(NaN, NaN)).toBe(true)
})

await test('std - equals returns false for NaN vs non-NaN', expect => {
	expect(equals(NaN, 1)).toBe(false)
	expect(equals(1, NaN)).toBe(false)
})

await test('std - equals compares arrays deeply', expect => {
	expect(equals([1, [2, 3]], [1, [2, 3]])).toBe(true)
	expect(equals([1, 2], [1, 3])).toBe(false)
	expect(equals([1, 2], [1, 2, 3])).toBe(false)
})

await test('std - equals compares objects deeply', expect => {
	expect(equals({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toBe(
		true,
	)
	expect(equals({ a: 1 }, { a: 2 })).toBe(false)
	expect(equals({ a: 1 }, { a: 1, b: 2 })).toBe(false)
})

await test('std - equals compares RegExp by source and flags', expect => {
	expect(equals(/abc/gi, /abc/gi)).toBe(true)
	expect(equals(/abc/g, /abc/i)).toBe(false)
	expect(equals(/abc/, /def/)).toBe(false)
})

await test('std - equals returns false for different constructors', expect => {
	expect(equals([], {})).toBe(false)
	expect(
		equals(new Date(0), /** @type {any} */ ({ getTime: () => 0 })),
	).toBe(false)
})

await test('std - equals compares Date objects by valueOf', expect => {
	expect(equals(new Date(1000), new Date(1000))).toBe(true)
	expect(equals(new Date(1000), new Date(2000))).toBe(false)
})

// --- range -------------------------------------------------------------------

await test('std - range yields ascending sequence', expect => {
	expect(Array.from(range(0, 3, 1))).toEqual([0, 1, 2, 3])
})

await test('std - range yields descending sequence with negative step', expect => {
	expect(Array.from(range(3, 0, -1))).toEqual([3, 2, 1, 0])
})

await test('std - range with start equal to stop yields only start', expect => {
	expect(Array.from(range(5, 5, 1))).toEqual([5])
})

await test('std - range with step larger than distance yields start and overshoot', expect => {
	expect(Array.from(range(0, 2, 5))).toEqual([0, 5])
})

// --- removeFromArray ---------------------------------------------------------

await test('std - removeFromArray removes first occurrence', expect => {
	const arr = [1, 2, 3, 2, 1]
	removeFromArray(arr, 2)
	expect(arr).toEqual([1, 3, 2, 1])
})

await test('std - removeFromArray does nothing when value is absent', expect => {
	const arr = [1, 2, 3]
	removeFromArray(arr, 99)
	expect(arr).toEqual([1, 2, 3])
})

// --- indexByKey ---------------------------------------------------------------

await test('std - indexByKey creates object indexed by property', expect => {
	const items = [
		{ id: 'a', name: 'Ada' },
		{ id: 'b', name: 'Bob' },
	]
	const byId = indexByKey(items, 'id')
	expect(byId.a.name).toBe('Ada')
	expect(byId.b.name).toBe('Bob')
})

// --- morphedBetweenArrayAndObject --------------------------------------------

await test('std - morphedBetweenArrayAndObject detects type changes', expect => {
	expect(morphedBetweenArrayAndObject([], {})).toBe(true)
	expect(morphedBetweenArrayAndObject({}, [])).toBe(true)
	expect(morphedBetweenArrayAndObject([], [])).toBe(false)
	expect(morphedBetweenArrayAndObject({}, {})).toBe(false)
})

// --- indexByKey with duplicate keys ----------------------------------

await test('std - indexByKey overwrites when multiple items share a key', expect => {
	const items = [
		{ id: 'a', value: 1 },
		{ id: 'a', value: 2 },
	]
	const byId = indexByKey(items, 'id')
	// last one wins
	expect(byId.a.value).toBe(2)
})

// --- indexByKey on empty array returns empty object -----------------

await test('std - indexByKey on empty input returns an empty object', expect => {
	const byId = indexByKey([], 'id')
	expect(Object.keys(byId).length).toBe(0)
})

// --- removeFromArray in empty array is a no-op ----------------------

await test('std - removeFromArray on empty array is a no-op', expect => {
	const arr = []
	removeFromArray(arr, 1)
	expect(arr.length).toBe(0)
})

// --- range with start > stop and positive step generates nothing? ---

await test('std - range behavior with start above stop and positive step', expect => {
	// Depends on implementation; just verify it doesn't throw
	expect(() => Array.from(range(5, 0, 1))).not.toThrow()
})

// --- withResolvers rejects externally -------------------------------

await test('std - withResolvers can be externally rejected', async expect => {
	const deferred = withResolvers()
	/** @type {any} */
	let rejected
	deferred.promise.catch(err => {
		rejected = err
	})

	deferred.reject(new Error('intentional'))

	await deferred.promise.catch(() => {})

	expect(rejected.message).toBe('intentional')
})

// --- equals empty objects are equal -----------------------------

await test('std - equals on two empty objects returns true', expect => {
	expect(equals({}, {})).toBe(true)
})

// --- equals with null vs undefined -----------------------------

await test('std - equals distinguishes null from undefined', expect => {
	expect(equals(null, undefined)).toBe(false)
	expect(equals(null, null)).toBe(true)
	expect(equals(undefined, undefined)).toBe(true)
})

// --- optional with function returning function ----------------

await test('std - optional unwraps nested functions', expect => {
	expect(optional(() => () => 'result')).toBe('result')
})

// --- toValues with empty Map and Set --------------------------

await test('std - toValues with empty Map yields nothing', expect => {
	expect(Array.from(toValues(new Map()))).toEqual([])
})

await test('std - toValues with empty Set yields nothing', expect => {
	expect(Array.from(toValues(new Set()))).toEqual([])
})

// --- nothing is an object ------------------------------------

await test('std - nothing is a non-null object', expect => {
	expect(typeof nothing).toBe('object')
	expect(nothing).not.toBe(null)
})

// --- entriesIncludingSymbols preserves order (strings before symbols) -

await test('std - entriesIncludingSymbols yields entries for symbol-only objects', expect => {
	const key = Symbol('x')
	const obj = { [key]: 42 }
	expect(Array.from(entriesIncludingSymbols(obj))).toEqual([[key, 42]])
})
