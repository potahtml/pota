/** @jsxImportSource pota */

// Tests for pota/store: signalify, mutable, merge, replace, reset,
// updateBlacklist, firewall, project, copy, and readonly.
import { test } from '#test'

import { root, syncEffect, signal } from 'pota'
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
