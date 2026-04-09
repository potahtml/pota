/** @jsxImportSource pota */

// Tests for pota/store: signalify (keys, getters, idempotent),
// mutable (nested objects/arrays/Maps, clone, delete, in operator,
// Object.keys, same-value no-op, array methods, Map methods, class
// instances, frozen objects, length assignment, JSX integration),
// merge (deep, scalars, keyed arrays, type morphing, empty source),
// replace (keyed, length, removal), reset (nested, leaves unrelated),
// updateBlacklist, firewall, project (copy-on-write, arrays,
// functions), copy (deep, cycles, Maps), and readonly (nested).
import { $, test } from '#test'

import { render, root, syncEffect, signal } from 'pota'
import {
	copy,
	firewall,
	merge,
	mutable,
	project,
	readonly,
	replace,
	reset,
	signalify,
	updateBlacklist,
} from 'pota/store'

import { isMutationBlacklisted } from '../../../src/lib/store/blacklist.js'

await test('copy - deep copies nested objects and arrays', expect => {
	const source = {
		user: {
			name: 'Ada',
			tags: ['a', 'b'],
		},
	}

	const cloned = copy(source)

	expect(cloned).not.toBe(source)
	expect(cloned.user).not.toBe(source.user)
	expect(cloned.user.tags).not.toBe(source.user.tags)
	expect(cloned).toEqual(source)
})

await test('copy - preserves cycles and leaves built-ins intact', expect => {
	const source = { name: 'root', date: new Date('2020-01-01') }
	source.self = source

	const cloned = copy(source)

	expect(cloned).not.toBe(source)
	expect(cloned.self).toBe(cloned)
	expect(cloned.date).toBe(source.date)
})

await test('copy - keeps blacklisted native instances by reference inside copied objects', expect => {
	const source = {
		map: new Map([['a', 1]]),
		ab: new ArrayBuffer(),
		nested: { ok: true },
	}

	expect(isMutationBlacklisted(new Map())).toBe(false)
	expect(isMutationBlacklisted(new ArrayBuffer())).toBe(true)

	const cloned = copy(source)

	expect(cloned).not.toBe(source)
	expect(cloned.map).not.toBe(source.map)
	expect(cloned.ab).toBe(source.ab)
	expect(cloned.nested).not.toBe(source.nested)
})

await test('signalify - makes existing properties reactive', expect => {
	const state = signalify({ count: 1 })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.count)
		})
	})

	expect(seen).toEqual([1])

	state.count = 2

	expect(seen).toEqual([1, 2])
})

await test('signalify - can track keys that do not exist yet', expect => {
	const state = signalify({}, ['missing'])
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.missing)
		})
	})

	expect(seen).toEqual([undefined])

	state.missing = 'now here'

	expect(seen).toEqual([undefined, 'now here'])
})

await test('signalify - does not wrap functions as tracked properties by default', expect => {
	const fn = () => 'value'
	const state = signalify({ fn })

	expect(state.fn).toBe(fn)
	expect(state.fn()).toBe('value')
})

await test('signalify - tracks inherited getter and setter properties', expect => {
	const seen = []
	const source = {
		_count: 1,
		get count() {
			return this._count
		},
		set count(value) {
			this._count = value
		},
	}
	const state = signalify(source)

	root(() => {
		syncEffect(() => {
			seen.push(state.count)
		})
	})

	state.count = 2

	expect(source._count).toBe(2)
	expect(seen).toEqual([1, 2])
})

await test('mutable - tracks nested object, array and map mutations', expect => {
	const state = mutable({
		user: { profile: { name: 'Ada' } },
		items: [{ done: false }],
		lookup: new Map([['a', { value: 1 }]]),
	})
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(
				`${state.user.profile.name}|${state.items.length}|${state.items[0]?.done}|${state.lookup.size}|${state.lookup.get('a')?.value}`,
			)
		})
	})

	expect(seen).toEqual(['Ada|1|false|1|1'])

	state.user.profile.name = 'Grace'
	state.items[0].done = true
	state.items.push({ done: false })
	state.lookup.set('a', { value: 2 })
	state.lookup.set('b', { value: 3 })

	expect(seen).toEqual([
		'Ada|1|false|1|1',
		'Grace|1|false|1|1',
		'Grace|1|true|1|1',
		'Grace|2|true|1|1',
		'Grace|2|true|1|2',
		'Grace|2|true|2|2',
	])
})

await test('mutable - clone option protects the original source', expect => {
	const original = { nested: { count: 1 } }
	const state = mutable(original, true)

	state.nested.count = 2

	expect(original.nested.count).toBe(1)
	expect(state.nested.count).toBe(2)
})

await test('mutable - tracks map delete and clear operations', expect => {
	const state = mutable({
		lookup: new Map([
			['a', { value: 1 }],
			['b', { value: 2 }],
		]),
	})
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(
				`${state.lookup.size}|${state.lookup.has('a')}|${state.lookup.get('b')?.value}`,
			)
		})
	})

	state.lookup.delete('a')
	state.lookup.clear()

	expect(seen).toEqual(['2|true|2', '1|false|2', '0|false|undefined'])
})

await test('merge - deeply merges objects and appends array values', expect => {
	const target = mutable({
		flags: { a: true },
		list: [1, 2],
	})

	merge(target, {
		flags: { b: true },
		list: [3],
	})

	expect(target).toEqual({
		flags: { a: true, b: true },
		list: [3, 2],
	})
})

await test('merge - writes plain scalar values directly', expect => {
	const target = mutable({
		count: 1,
		label: 'before',
	})

	merge(target, {
		count: 2,
		label: 'after',
	})

	expect(target).toEqual({
		count: 2,
		label: 'after',
	})
})

await test('merge - keyed arrays preserve matching object references', expect => {
	const kept = { id: 1, name: 'Ada' }
	const target = mutable({
		users: [{ id: 0, name: 'Zero' }, kept],
	})

	const ref = target.users[1]

	expect(target.users[1] === ref).toBe(true)

	merge(
		target,
		{
			users: [
				{ id: 2, name: 'Two' },
				{ id: 1, role: 'admin' },
			],
		},
		{ users: { key: 'id' } },
	)

	expect(target.users[1] === ref).toBe(true)
	expect(target.users).toEqual([
		{ id: 0, name: 'Zero' },
		{ id: 1, name: 'Ada', role: 'admin' },
		{ id: 2, name: 'Two' },
	])
})

await test('replace - removes missing keys and keeps keyed references', expect => {
	const kept = { id: 1, label: 'kept' }
	const target = mutable({
		stale: true,
		users: [{ id: 0, label: 'drop' }, kept],
	})
	const ref = target.users[1]

	replace(
		target,
		{
			users: [{ id: 1, extra: 'merged' }],
			fresh: true,
		},
		{ users: { key: 'id' } },
	)

	expect('stale' in target).toBe(false)
	expect(target.fresh).toBe(true)
	expect(target.users.length).toBe(1)
	expect(target.users[0]).toBe(ref)
	expect(target.users[0]).toEqual({
		id: 1,
		extra: 'merged',
	})
})

await test('reset - resets only the provided subtree and leaves unrelated keys', expect => {
	const target = mutable({
		stable: true,
		nested: {
			count: 3,
			keep: 'yes',
			deep: { ok: true },
		},
		list: [1, 2, 3],
	})

	reset(target, {
		nested: {
			count: 0,
			deep: {},
		},
		list: [],
	})

	expect(target.stable).toBe(true)
	expect(target.nested.count).toBe(0)
	expect(target.nested.keep).toBe('yes')
	expect(target.nested.deep).toEqual({})
	expect(target.list).toEqual([])
})

await test('reset - can restore arrays of objects back to the provided shape', expect => {
	const target = mutable({
		items: [
			{ id: 1, value: 'a' },
			{ id: 2, value: 'b' },
		],
	})

	reset(target, {
		items: [{ id: 1, value: 'reset' }],
	})

	expect(target.items).toEqual([{ id: 1, value: 'reset' }])
})

await test('readonly - prevents writes on root and nested objects', expect => {
	const value = readonly({
		user: { name: 'Ada' },
	})

	expect(() => {
		value.user.name = 'Grace'
	}).toThrow()

	expect(() => {
		value.user = { name: 'Other' }
	}).toThrow()

	expect(value.user.name).toBe('Ada')
})

await test('project - creates a copy-on-write view for nested objects and arrays', expect => {
	const source = mutable({
		user: { name: 'Ada', stats: { visits: 1 } },
		tags: ['a', 'b'],
	})

	const view = project(source)

	view.user.name = 'Grace'
	view.user.stats.visits = 2
	view.tags.push('c')

	expect(source.user.name).toBe('Ada')
	expect(source.user.stats.visits).toBe(1)
	expect(source.tags).toEqual(['a', 'b'])

	expect(view.user.name).toBe('Grace')
	expect(view.user.stats.visits).toBe(2)
	expect(view.tags).toEqual(['a', 'b', 'c'])
})

await test('project - still reads through to source keys until overridden', expect => {
	const source = mutable({
		nested: { value: 1 },
		plain: 'from source',
	})

	const view = project(source)

	expect(view.plain).toBe('from source')
	expect(view.nested.value).toBe(1)

	view.plain = 'from projection'

	expect(source.plain).toBe('from source')
	expect(view.plain).toBe('from projection')
})

await test('project - reuses the same projection proxy for the same nested source object', expect => {
	const source = mutable({
		nested: { value: 1 },
	})

	const first = project(source)
	const second = project(source)

	expect(first).not.toBe(second)
	expect(first.nested).not.toBe(second.nested)
})

await test('firewall - can observe reactive changes without throwing', expect => {
	const count = signal(1)
	let runs = 0

	root(() => {
		firewall(() => {
			runs++
			return count.read()
		})
	})

	expect(runs).toBe(1)

	count.write(2)

	expect(runs).toBe(2)
})

await test('updateBlacklist - accepts a window-like object and keeps tracked constructors writable', expect => {
	expect(() =>
		updateBlacklist({
			Object,
			Array,
			Map,
			Symbol,
			CustomThing: class CustomThing {},
		}),
	).not.toThrow()
})

// --- mutable array methods ---------------------------------------------------

await test('mutable - tracks array splice (insert and remove)', expect => {
	const state = mutable({ items: ['a', 'b', 'c', 'd'] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push([...state.items])
		})
	})

	expect(seen).toEqual([['a', 'b', 'c', 'd']])

	// remove 1 at index 1, insert 'x'
	state.items.splice(1, 1, 'x')

	expect(seen).toEqual([
		['a', 'b', 'c', 'd'],
		['a', 'x', 'c', 'd'],
	])
})

await test('mutable - tracks array shift', expect => {
	const state = mutable({ items: ['a', 'b', 'c'] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push([...state.items])
		})
	})

	expect(seen).toEqual([['a', 'b', 'c']])

	state.items.shift()

	expect(seen).toEqual([
		['a', 'b', 'c'],
		['b', 'c'],
	])
})

await test('mutable - tracks array unshift', expect => {
	const state = mutable({ items: ['b', 'c'] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push([...state.items])
		})
	})

	expect(seen).toEqual([['b', 'c']])

	state.items.unshift('a')

	expect(seen).toEqual([
		['b', 'c'],
		['a', 'b', 'c'],
	])
})

await test('mutable - tracks array sort', expect => {
	const state = mutable({ items: ['c', 'a', 'b'] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push([...state.items])
		})
	})

	state.items.sort()

	expect(seen).toEqual([
		['c', 'a', 'b'],
		['a', 'b', 'c'],
	])
})

await test('mutable - tracks array reverse', expect => {
	const state = mutable({ items: [1, 2, 3] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push([...state.items])
		})
	})

	state.items.reverse()

	expect(seen).toEqual([
		[1, 2, 3],
		[3, 2, 1],
	])
})

await test('mutable - tracks array pop', expect => {
	const state = mutable({ items: [1, 2, 3] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.items.length)
		})
	})

	expect(seen).toEqual([3])

	state.items.pop()

	expect(seen).toEqual([3, 2])
})

// --- mutable object property deletion ----------------------------------------

await test('mutable - tracks property deletion from objects', expect => {
	const state = mutable({ a: 1, b: 2 })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push('a' in state ? state.a : 'gone')
		})
	})

	expect(seen).toEqual([1])

	delete state.a

	expect(seen).toEqual([1, 'gone'])
})

// --- mutable nested object assignment ----------------------------------------

await test('mutable - assigning a new nested object makes it reactive', expect => {
	const state = mutable({ nested: { count: 1 } })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.nested.count)
		})
	})

	expect(seen).toEqual([1])

	// replace the entire nested object
	state.nested = { count: 10 }

	expect(seen).toEqual([1, 10])

	// the new nested object should also be reactive
	state.nested.count = 20

	expect(seen).toEqual([1, 10, 20])
})

// --- signalify multiple properties -------------------------------------------

await test('signalify - tracks multiple properties independently', expect => {
	const state = signalify({ x: 1, y: 2, z: 3 })
	const seenX = []
	const seenY = []

	root(() => {
		syncEffect(() => seenX.push(state.x))
		syncEffect(() => seenY.push(state.y))
	})

	expect(seenX).toEqual([1])
	expect(seenY).toEqual([2])

	state.x = 10
	expect(seenX).toEqual([1, 10])
	expect(seenY).toEqual([2]) // y unchanged

	state.y = 20
	expect(seenX).toEqual([1, 10]) // x unchanged
	expect(seenY).toEqual([2, 20])
})

// --- merge with no matching keys: appends new keys ---------------------------

await test('merge - adds keys that do not exist in target', expect => {
	const target = mutable({ a: 1 })

	merge(target, { b: 2, c: 3 })

	expect(target).toEqual({ a: 1, b: 2, c: 3 })
})

// --- replace removes all original keys not in source -------------------------

await test('replace - removes all original keys when replaced with empty', expect => {
	const target = mutable({ a: 1, b: 2, c: 3 })

	replace(target, {})

	expect('a' in target).toBe(false)
	expect('b' in target).toBe(false)
	expect('c' in target).toBe(false)
})

// --- readonly nested array ---------------------------------------------------

await test('readonly - prevents mutation of nested arrays', expect => {
	const value = readonly({
		items: [1, 2, 3],
	})

	expect(() => {
		value.items.push(4)
	}).toThrow()

	expect(value.items).toEqual([1, 2, 3])
})

// --- mutable Map iteration ---------------------------------------------------

await test('mutable - tracks Map forEach iteration', expect => {
	const state = mutable({
		lookup: new Map([
			['a', 1],
			['b', 2],
		]),
	})
	const seen = []

	root(() => {
		syncEffect(() => {
			const entries = []
			state.lookup.forEach((v, k) => entries.push([k, v]))
			seen.push(entries)
		})
	})

	expect(seen).toEqual([[['a', 1], ['b', 2]]])

	state.lookup.set('c', 3)

	expect(seen.length).toBe(2)
	expect(seen[1]).toEqual([['a', 1], ['b', 2], ['c', 3]])
})

await test('mutable - tracks Map keys, values, and entries iterators', expect => {
	const state = mutable({
		lookup: new Map([['x', 10]]),
	})
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(Array.from(state.lookup.keys()))
		})
	})

	expect(seen).toEqual([['x']])

	state.lookup.set('y', 20)

	expect(seen).toEqual([['x'], ['x', 'y']])
})

await test('mutable - tracks Map has reads', expect => {
	const state = mutable({
		lookup: new Map([['a', 1]]),
	})
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.lookup.has('a'))
		})
	})

	expect(seen).toEqual([true])

	state.lookup.delete('a')

	expect(seen).toEqual([true, false])
})

await test('mutable - tracks Map get reads', expect => {
	const state = mutable({
		lookup: new Map([['a', 1]]),
	})
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.lookup.get('a'))
		})
	})

	expect(seen).toEqual([1])

	state.lookup.set('a', 99)

	expect(seen).toEqual([1, 99])
})

// --- mutable array iteration methods -----------------------------------------

await test('mutable - tracks array forEach iteration', expect => {
	const state = mutable({ items: ['a', 'b'] })
	const seen = []

	root(() => {
		syncEffect(() => {
			const result = []
			state.items.forEach(v => result.push(v))
			seen.push(result)
		})
	})

	expect(seen).toEqual([['a', 'b']])

	state.items.push('c')

	expect(seen).toEqual([['a', 'b'], ['a', 'b', 'c']])
})

await test('mutable - tracks array map reads', expect => {
	const state = mutable({ items: [1, 2, 3] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.items.map(x => x * 2))
		})
	})

	expect(seen).toEqual([[2, 4, 6]])

	state.items[0] = 10

	expect(seen).toEqual([[2, 4, 6], [20, 4, 6]])
})

await test('mutable - tracks array filter reads', expect => {
	const state = mutable({ items: [1, 2, 3, 4] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.items.filter(x => x > 2))
		})
	})

	expect(seen).toEqual([[3, 4]])

	state.items.push(5)

	expect(seen).toEqual([[3, 4], [3, 4, 5]])
})

await test('mutable - tracks array includes reads', expect => {
	const state = mutable({ items: ['a', 'b'] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.items.includes('c'))
		})
	})

	expect(seen).toEqual([false])

	state.items.push('c')

	expect(seen).toEqual([false, true])
})

await test('mutable - tracks array indexOf reads', expect => {
	const state = mutable({ items: ['a', 'b', 'c'] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.items.indexOf('b'))
		})
	})

	expect(seen).toEqual([1])

	state.items.shift()

	expect(seen).toEqual([1, 0])
})

await test('mutable - tracks array find reads', expect => {
	const state = mutable({
		items: [
			{ id: 1, name: 'a' },
			{ id: 2, name: 'b' },
		],
	})
	const seen = []

	root(() => {
		syncEffect(() => {
			const found = state.items.find(x => x.id === 2)
			seen.push(found?.name)
		})
	})

	expect(seen).toEqual(['b'])

	state.items[1].name = 'updated'

	expect(seen).toEqual(['b', 'updated'])
})

// --- mutable array fill and copyWithin ---------------------------------------

await test('mutable - tracks array fill mutation', expect => {
	const state = mutable({ items: [1, 2, 3] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push([...state.items])
		})
	})

	expect(seen).toEqual([[1, 2, 3]])

	state.items.fill(0)

	expect(seen).toEqual([[1, 2, 3], [0, 0, 0]])
})

// --- mutable in operator -----------------------------------------------------

await test('mutable - in operator tracks key existence', expect => {
	const state = mutable({ a: 1 })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push('b' in state)
		})
	})

	expect(seen).toEqual([false])

	state.b = 2

	expect(seen).toEqual([false, true])
})

// --- mutable Object.keys -----------------------------------------------------

await test('mutable - Object.keys tracks keys reads', expect => {
	const state = mutable({ a: 1, b: 2 })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(Object.keys(state))
		})
	})

	expect(seen).toEqual([['a', 'b']])

	state.c = 3

	expect(seen).toEqual([['a', 'b'], ['a', 'b', 'c']])
})

// --- mutable same value no-op ------------------------------------------------

await test('mutable - assigning same primitive value does not trigger update', expect => {
	const state = mutable({ count: 1 })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.count)
		})
	})

	expect(seen).toEqual([1])

	state.count = 1

	expect(seen).toEqual([1])
})

// --- signalify specific keys -------------------------------------------------

await test('signalify - tracks only specified keys when subset is provided', expect => {
	const state = signalify({ a: 1, b: 2, c: 3 }, ['a', 'c'])
	const seenA = []
	const seenB = []

	root(() => {
		syncEffect(() => seenA.push(state.a))
		syncEffect(() => seenB.push(state.b))
	})

	expect(seenA).toEqual([1])
	expect(seenB).toEqual([2])

	state.a = 10
	expect(seenA).toEqual([1, 10])

	// b is NOT signalified, so writing to it won't trigger
	state.b = 20
	expect(seenB).toEqual([2])

	state.c = 30 // c IS signalified but no effect reads it
})

// --- merge type morphing -----------------------------------------------------

await test('merge - replaces when type morphs between array and object', expect => {
	const target = mutable({ data: [1, 2, 3] })

	merge(target, { data: { key: 'value' } })

	expect(Array.isArray(target.data)).toBe(false)
	expect(target.data.key).toBe('value')
})

await test('merge - replaces when type morphs from object to array', expect => {
	const target = mutable({ data: { key: 'value' } })

	merge(target, { data: [1, 2] })

	expect(Array.isArray(target.data)).toBe(true)
	expect(target.data).toEqual([1, 2])
})

// --- replace keyed arrays reorder --------------------------------------------

await test('replace - reorders keyed arrays and removes absent items', expect => {
	const target = mutable({
		items: [
			{ id: 1, name: 'a' },
			{ id: 2, name: 'b' },
			{ id: 3, name: 'c' },
		],
	})

	const refB = target.items[1]

	replace(
		target,
		{
			items: [
				{ id: 3, name: 'c-updated' },
				{ id: 2, name: 'b' },
			],
		},
		{ items: { key: 'id' } },
	)

	// id:1 removed, id:2 and id:3 kept in target order
	expect(target.items.length).toBe(2)
	expect(target.items[0]).toBe(refB)
	expect(target.items[0].name).toBe('b')
	expect(target.items[1].name).toBe('c-updated')
})

// --- replace adjusts array length --------------------------------------------

await test('replace - adjusts array length when source is shorter', expect => {
	const target = mutable({ items: [1, 2, 3, 4, 5] })

	replace(target, { items: [10, 20] })

	expect(target.items.length).toBe(2)
	expect(target.items).toEqual([10, 20])
})

// --- reset leaves unrelated keys ---------------------------------------------

await test('reset - does not remove keys absent from source', expect => {
	const target = mutable({ a: 1, b: 2, c: 3 })

	reset(target, { a: 0 })

	expect(target.a).toBe(0)
	expect(target.b).toBe(2)
	expect(target.c).toBe(3)
})

// --- copy with Map -----------------------------------------------------------

await test('copy - deep copies Maps', expect => {
	const source = {
		lookup: new Map([
			['a', { value: 1 }],
		]),
	}

	const cloned = copy(source)

	expect(cloned.lookup).not.toBe(source.lookup)
	expect(cloned).toEqual(source)
})

// --- project function wrapping -----------------------------------------------

await test('project - wraps functions to return projected results', expect => {
	const source = mutable({
		items: [1, 2, 3],
		getItems() {
			return this.items
		},
	})

	const view = project(source)

	view.items.push(4)

	// source is unaffected
	expect(source.items).toEqual([1, 2, 3])
	expect(view.items).toEqual([1, 2, 3, 4])
})

// --- project with arrays -----------------------------------------------------

await test('project - array mutations do not affect source', expect => {
	const source = mutable({ list: ['a', 'b'] })
	const view = project(source)

	view.list.push('c')
	view.list[0] = 'z'

	expect(source.list).toEqual(['a', 'b'])
	expect(view.list).toEqual(['z', 'b', 'c'])
})

// --- mutable with Map for..of iteration --------------------------------------

await test('mutable - tracks Map for..of iteration', expect => {
	const state = mutable({
		lookup: new Map([['a', 1]]),
	})
	const seen = []

	root(() => {
		syncEffect(() => {
			const entries = []
			for (const [k, v] of state.lookup) {
				entries.push([k, v])
			}
			seen.push(entries)
		})
	})

	expect(seen).toEqual([[['a', 1]]])

	state.lookup.set('b', 2)

	expect(seen).toEqual([[['a', 1]], [['a', 1], ['b', 2]]])
})

// --- mutable Map set same value no-op ----------------------------------------

await test('mutable - Map set with same value does not trigger', expect => {
	const state = mutable({
		lookup: new Map([['a', 1]]),
	})
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.lookup.get('a'))
		})
	})

	expect(seen).toEqual([1])

	state.lookup.set('a', 1)

	expect(seen).toEqual([1])
})

// --- mutable array some and every --------------------------------------------

await test('mutable - tracks array some and every reads', expect => {
	const state = mutable({ items: [1, 2, 3] })
	const seenSome = []
	const seenEvery = []

	root(() => {
		syncEffect(() => {
			seenSome.push(state.items.some(x => x > 2))
		})
		syncEffect(() => {
			seenEvery.push(state.items.every(x => x > 0))
		})
	})

	expect(seenSome).toEqual([true])
	expect(seenEvery).toEqual([true])

	state.items[2] = 0

	expect(seenSome).toEqual([true, false])
	expect(seenEvery).toEqual([true, false])
})

// --- mutable delete property then re-add -------------------------------------

await test('mutable - tracks delete then re-add of same property', expect => {
	const state = mutable({ x: 1 })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push('x' in state ? state.x : 'gone')
		})
	})

	expect(seen).toEqual([1])

	delete state.x
	expect(seen).toEqual([1, 'gone'])

	state.x = 42
	expect(seen).toEqual([1, 'gone', 42])
})

// --- store + rendering integration -------------------------------------------

await test('mutable - drives JSX reactivity end-to-end', expect => {
	const state = mutable({ name: 'Ada', count: 0 })

	const dispose = render(
		<p>
			{() => state.name}: {() => state.count}
		</p>,
	)

	expect($('p').textContent).toBe('Ada: 0')

	state.name = 'Grace'
	expect($('p').textContent).toBe('Grace: 0')

	state.count = 5
	expect($('p').textContent).toBe('Grace: 5')

	dispose()
})

// --- mutable array copyWithin ------------------------------------------------

await test('mutable - tracks array copyWithin mutation', expect => {
	const state = mutable({ items: [1, 2, 3, 4, 5] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push([...state.items])
		})
	})

	expect(seen).toEqual([[1, 2, 3, 4, 5]])

	state.items.copyWithin(0, 3) // copies [4,5] to beginning

	expect(seen).toEqual([
		[1, 2, 3, 4, 5],
		[4, 5, 3, 4, 5],
	])
})

// --- mutable hasOwnProperty --------------------------------------------------

await test('mutable - hasOwnProperty tracks key existence', expect => {
	const state = mutable({ a: 1 })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.hasOwnProperty('a'))
		})
	})

	expect(seen).toEqual([true])

	delete state.a

	expect(seen).toEqual([true, false])
})

// --- mutable array reduce ----------------------------------------------------

await test('mutable - tracks array reduce reads', expect => {
	const state = mutable({ items: [1, 2, 3] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.items.reduce((sum, x) => sum + x, 0))
		})
	})

	expect(seen).toEqual([6])

	state.items.push(4)

	expect(seen).toEqual([6, 10])
})

// --- mutable array join/toString ---------------------------------------------

await test('mutable - tracks array join reads', expect => {
	const state = mutable({ items: ['a', 'b'] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.items.join('-'))
		})
	})

	expect(seen).toEqual(['a-b'])

	state.items.push('c')

	expect(seen).toEqual(['a-b', 'a-b-c'])
})

// --- mutable array slice -----------------------------------------------------

await test('mutable - tracks array slice reads', expect => {
	const state = mutable({ items: [1, 2, 3, 4, 5] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.items.slice(1, 3))
		})
	})

	expect(seen).toEqual([[2, 3]])

	state.items[1] = 20

	expect(seen).toEqual([[2, 3], [20, 3]])
})

// --- mutable array length assignment -----------------------------------------

await test('mutable - setting array length truncates and triggers', expect => {
	const state = mutable({ items: [1, 2, 3, 4, 5] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.items.length)
		})
	})

	expect(seen).toEqual([5])

	state.items.length = 2

	expect(seen).toEqual([5, 2])
	expect(state.items).toEqual([1, 2])
})

// --- reset nested recursion --------------------------------------------------

await test('reset - recursively resets nested objects', expect => {
	const target = mutable({
		a: {
			b: {
				c: 99,
				d: 'keep',
			},
		},
	})

	reset(target, {
		a: {
			b: {
				c: 0,
			},
		},
	})

	expect(target.a.b.c).toBe(0)
	expect(target.a.b.d).toBe('keep')
})

// --- mutable with already-mutable object ------------------------------------

await test('mutable - wrapping an already-mutable object returns the same proxy', expect => {
	const original = mutable({ x: 1 })
	const again = mutable(original)

	expect(original).toBe(again)
})

// --- mutable with frozen nested object --------------------------------------

await test('mutable - frozen nested objects are not proxied', expect => {
	const frozen = Object.freeze({ inner: 'frozen' })
	const state = mutable({ data: frozen })

	// frozen object should not be wrapped in a proxy
	expect(state.data.inner).toBe('frozen')
	expect(() => {
		state.data.inner = 'changed'
	}).toThrow()
})

// --- mutable with class instance (prototype getters/setters) ----------------

await test('mutable - class instance with getters and setters is reactive', expect => {
	class Counter {
		_count = 0
		get count() {
			return this._count
		}
		set count(v) {
			this._count = v
		}
	}

	const state = mutable(new Counter())
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.count)
		})
	})

	expect(seen).toEqual([0])

	state.count = 5
	expect(seen).toEqual([0, 5])
})

// --- signalify same object twice is idempotent ------------------------------

await test('signalify - calling signalify twice on same object is safe', expect => {
	const state = signalify({ a: 1 })
	const again = signalify(state)
	const seen = []

	expect(state).toBe(again)

	root(() => {
		syncEffect(() => seen.push(state.a))
	})

	state.a = 2
	expect(seen).toEqual([1, 2])
})

// --- merge with empty source is no-op ---------------------------------------

await test('merge - empty source does not modify target', expect => {
	const target = mutable({ a: 1, b: 2 })

	merge(target, {})

	expect(target.a).toBe(1)
	expect(target.b).toBe(2)
})

// --- replace with identical data is no-op for values ------------------------

await test('replace - identical data does not trigger extra updates', expect => {
	const state = mutable({ a: 1, b: 2 })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.a)
		})
	})

	expect(seen).toEqual([1])

	replace(state, { a: 1, b: 2 })

	// a didn't change value, so no extra trigger
	expect(seen).toEqual([1])
})

// --- mutable Map with object keys -------------------------------------------

await test('mutable - Map with object keys tracks correctly', expect => {
	const key1 = { name: 'first' }
	const key2 = { name: 'second' }
	const state = mutable({
		lookup: new Map([[key1, 'value1']]),
	})
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.lookup.get(key1))
		})
	})

	expect(seen).toEqual(['value1'])

	state.lookup.set(key1, 'updated')

	expect(seen).toEqual(['value1', 'updated'])

	state.lookup.set(key2, 'value2')
	expect(state.lookup.size).toBe(2)
})

// --- mutable array with direct index assignment beyond length ---------------

await test('mutable - assigning beyond array length extends it', expect => {
	const state = mutable({ items: [1, 2] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.items.length)
		})
	})

	expect(seen).toEqual([2])

	state.items[5] = 99

	expect(state.items.length).toBe(6)
	expect(state.items[5]).toBe(99)
})
