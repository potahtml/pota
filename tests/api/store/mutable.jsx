/** @jsxImportSource pota */

// Tests for pota/store `mutable`: nested object/array/Map tracking,
// clone option, every array mutation method, every Map method,
// property deletion, in/hasOwnProperty/Object.keys, same-value
// no-op, frozen nested objects, class instances, and JSX integration.
import { $, test } from '#test'

import { batch, render, root, syncEffect } from 'pota'
import { mutable } from 'pota/store'

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

// ============================================================================
// Additional coverage: edge cases, extra array methods, integration patterns
// ============================================================================

// --- reading a key that does not exist yet tracks its appearance -----------

await test('mutable - reading a missing key tracks until it is added', expect => {
	const state = mutable({ a: 1 })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.missing)
		})
	})

	expect(seen).toEqual([undefined])

	state.missing = 'added'

	expect(seen).toEqual([undefined, 'added'])
})

// --- deleting a non-existent key is a silent no-op ------------------------

await test('mutable - deleting a key that was never there does not trigger effects', expect => {
	const state = mutable({ a: 1 })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push('ghost' in state)
		})
	})

	expect(seen).toEqual([false])

	delete state.ghost

	expect(seen).toEqual([false])
})

// --- null and undefined values are set but still tracked -------------------

await test('mutable - setting a property to null triggers the effect', expect => {
	const state = mutable({ value: 'something' })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.value)
		})
	})

	expect(seen).toEqual(['something'])

	state.value = null

	expect(seen).toEqual(['something', null])
})

await test('mutable - setting a property to undefined triggers the effect', expect => {
	const state = mutable({ value: 1 })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.value)
		})
	})

	expect(seen).toEqual([1])

	state.value = undefined

	expect(seen).toEqual([1, undefined])
})

// --- NaN equality: Object.is treats NaN as equal so no re-trigger ---------

await test('mutable - assigning NaN twice does not re-trigger (Object.is equality)', expect => {
	const state = mutable({ value: 0 })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.value)
		})
	})

	expect(seen).toEqual([0])

	state.value = NaN
	expect(seen.length).toBe(2)
	expect(Number.isNaN(seen[1])).toBe(true)

	state.value = NaN
	// Object.is(NaN, NaN) === true, so no additional trigger
	expect(seen.length).toBe(2)
})

// --- batch: many writes to same key only re-run the effect once -----------

await test('mutable - batching many writes to the same key only triggers once', expect => {
	const state = mutable({ count: 0 })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.count)
		})
	})

	expect(seen).toEqual([0])

	batch(() => {
		state.count = 1
		state.count = 2
		state.count = 3
	})

	// Effect sees initial value plus the final batched value
	expect(seen).toEqual([0, 3])
})

// --- batch: writes to different keys read by one effect only trigger once -

await test('mutable - batching writes across keys triggers a single re-run', expect => {
	const state = mutable({ a: 1, b: 2 })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.a + state.b)
		})
	})

	expect(seen).toEqual([3])

	batch(() => {
		state.a = 10
		state.b = 20
	})

	expect(seen).toEqual([3, 30])
})

// --- multiple effects on the same key share tracking ----------------------

await test('mutable - multiple effects reading the same key all re-run', expect => {
	const state = mutable({ count: 1 })
	const seenA = []
	const seenB = []

	root(() => {
		syncEffect(() => seenA.push(state.count))
		syncEffect(() => seenB.push(state.count))
	})

	expect(seenA).toEqual([1])
	expect(seenB).toEqual([1])

	state.count = 2

	expect(seenA).toEqual([1, 2])
	expect(seenB).toEqual([1, 2])
})

// --- Object.create(null) targets work as mutables -------------------------

await test('mutable - Object.create(null) targets are proxied and reactive', expect => {
	const raw = Object.create(null)
	raw.a = 1
	const state = mutable(raw)
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.a)
		})
	})

	expect(seen).toEqual([1])

	state.a = 2

	expect(seen).toEqual([1, 2])
})

// --- spread operators: {...state} and [...state] -------------------------

await test('mutable - object spread reads all keys and produces a plain object', expect => {
	const state = mutable({ a: 1, b: 2, c: 3 })

	const copy = { ...state }

	expect(copy).toEqual({ a: 1, b: 2, c: 3 })
	// spread returns a plain object, not a proxy
	expect(copy).not.toBe(state)
})

await test('mutable - array spread produces a plain array with the same values', expect => {
	const state = mutable({ items: [1, 2, 3] })

	const copy = [...state.items]

	expect(copy).toEqual([1, 2, 3])
	expect(Array.isArray(copy)).toBe(true)
})

// --- Array.isArray on a mutable array still returns true ------------------

await test('mutable - Array.isArray returns true for a mutable array', expect => {
	const state = mutable({ items: [1, 2, 3] })

	expect(Array.isArray(state.items)).toBe(true)
})

// --- JSON.stringify of a mutable produces the expected JSON ---------------

await test('mutable - JSON.stringify of a mutable object produces the expected output', expect => {
	const state = mutable({
		a: 1,
		b: 'two',
		nested: { x: true },
		list: [1, 2, 3],
	})

	expect(JSON.parse(JSON.stringify(state))).toEqual({
		a: 1,
		b: 'two',
		nested: { x: true },
		list: [1, 2, 3],
	})
})

// --- destructuring reads the keys -----------------------------------------

await test('mutable - destructuring reads the named keys', expect => {
	const state = mutable({ name: 'Ada', age: 1 })
	const seen = []

	root(() => {
		syncEffect(() => {
			const { name } = state
			seen.push(name)
		})
	})

	expect(seen).toEqual(['Ada'])

	state.name = 'Grace'
	expect(seen).toEqual(['Ada', 'Grace'])

	// changing an un-destructured key does not trigger
	state.age = 2
	expect(seen).toEqual(['Ada', 'Grace'])
})

// --- for..of iteration over a mutable array is tracked --------------------

await test('mutable - for..of over a mutable array tracks the full iteration', expect => {
	const state = mutable({ items: ['a', 'b'] })
	const seen = []

	root(() => {
		syncEffect(() => {
			const out = []
			for (const v of state.items) {
				out.push(v)
			}
			seen.push(out)
		})
	})

	expect(seen).toEqual([['a', 'b']])

	state.items.push('c')

	expect(seen).toEqual([
		['a', 'b'],
		['a', 'b', 'c'],
	])
})

// --- for..in iteration over a mutable object is tracked ------------------

await test('mutable - for..in over a mutable object tracks key additions', expect => {
	const state = mutable({ a: 1, b: 2 })
	const seen = []

	root(() => {
		syncEffect(() => {
			const keys = []
			for (const k in state) keys.push(k)
			seen.push(keys.sort())
		})
	})

	expect(seen).toEqual([['a', 'b']])

	state.c = 3

	expect(seen.length).toBe(2)
	expect(seen[1]).toEqual(['a', 'b', 'c'])
})

// --- extra array method coverage ------------------------------------------

await test('mutable - tracks Array.prototype.at with a positive index', expect => {
	const state = mutable({ items: [10, 20, 30] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.items.at(1))
		})
	})

	expect(seen).toEqual([20])

	state.items[1] = 99

	expect(seen).toEqual([20, 99])
})

await test('mutable - tracks Array.prototype.at with a negative index', expect => {
	const state = mutable({ items: [10, 20, 30] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.items.at(-1))
		})
	})

	expect(seen).toEqual([30])

	state.items[2] = 99

	expect(seen).toEqual([30, 99])
})

await test('mutable - tracks Array.prototype.lastIndexOf', expect => {
	const state = mutable({ items: ['a', 'b', 'a'] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.items.lastIndexOf('a'))
		})
	})

	expect(seen).toEqual([2])

	state.items.pop()

	expect(seen).toEqual([2, 0])
})

await test('mutable - tracks Array.prototype.findIndex', expect => {
	const state = mutable({ items: [{ id: 1 }, { id: 2 }, { id: 3 }] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.items.findIndex(x => x.id === 2))
		})
	})

	expect(seen).toEqual([1])

	state.items.unshift({ id: 0 })

	expect(seen).toEqual([1, 2])
})

await test('mutable - tracks Array.prototype.findLast', expect => {
	const state = mutable({ items: [1, 2, 3, 2, 1] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.items.findLast(x => x > 1))
		})
	})

	expect(seen).toEqual([2])

	state.items.push(3)

	expect(seen).toEqual([2, 3])
})

await test('mutable - tracks Array.prototype.findLastIndex', expect => {
	const state = mutable({ items: [1, 2, 3, 2, 1] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.items.findLastIndex(x => x === 2))
		})
	})

	expect(seen).toEqual([3])

	state.items.pop()

	expect(seen).toEqual([3, 3])
})

await test('mutable - tracks Array.prototype.flat', expect => {
	const state = mutable({ items: [[1, 2], [3, 4]] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.items.flat())
		})
	})

	expect(seen).toEqual([[1, 2, 3, 4]])

	state.items.push([5])

	expect(seen).toEqual([
		[1, 2, 3, 4],
		[1, 2, 3, 4, 5],
	])
})

await test('mutable - tracks Array.prototype.flatMap', expect => {
	const state = mutable({ items: [1, 2, 3] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.items.flatMap(x => [x, x * 10]))
		})
	})

	expect(seen).toEqual([[1, 10, 2, 20, 3, 30]])

	state.items.push(4)

	expect(seen).toEqual([
		[1, 10, 2, 20, 3, 30],
		[1, 10, 2, 20, 3, 30, 4, 40],
	])
})

await test('mutable - tracks Array.prototype.concat', expect => {
	const state = mutable({ items: [1, 2] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.items.concat([3, 4]))
		})
	})

	expect(seen).toEqual([[1, 2, 3, 4]])

	state.items.push(99)

	expect(seen).toEqual([
		[1, 2, 3, 4],
		[1, 2, 99, 3, 4],
	])
})

await test('mutable - tracks Array.prototype.toReversed (immutable)', expect => {
	const state = mutable({ items: [1, 2, 3] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.items.toReversed())
		})
	})

	expect(seen).toEqual([[3, 2, 1]])
	// original untouched
	expect(state.items).toEqual([1, 2, 3])

	state.items.push(4)

	expect(seen).toEqual([
		[3, 2, 1],
		[4, 3, 2, 1],
	])
})

await test('mutable - tracks Array.prototype.toSorted (immutable)', expect => {
	const state = mutable({ items: [3, 1, 2] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.items.toSorted())
		})
	})

	expect(seen).toEqual([[1, 2, 3]])
	// original untouched
	expect(state.items).toEqual([3, 1, 2])

	state.items.push(0)

	expect(seen).toEqual([
		[1, 2, 3],
		[0, 1, 2, 3],
	])
})

await test('mutable - tracks Array.prototype.with (immutable)', expect => {
	const state = mutable({ items: [1, 2, 3] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.items.with(1, 99))
		})
	})

	expect(seen).toEqual([[1, 99, 3]])
	// original untouched
	expect(state.items).toEqual([1, 2, 3])

	state.items[1] = 50

	expect(seen).toEqual([
		[1, 99, 3],
		[1, 99, 3],
	])
})

// --- getters on inherited prototype chain of class instance --------------

await test('mutable - class with a getter returning a computed value is reactive', expect => {
	class Doubler {
		_base = 1
		get doubled() {
			return this._base * 2
		}
		set doubled(v) {
			this._base = v / 2
		}
	}

	const state = mutable(new Doubler())
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.doubled)
		})
	})

	expect(seen).toEqual([2])

	state.doubled = 10
	expect(seen).toEqual([2, 10])
	expect(state._base).toBe(5)
})

// --- nested mutable passed as value preserves its identity --------------

await test('mutable - assigning an already-mutable object to a key keeps its identity', expect => {
	const inner = mutable({ count: 1 })
	const outer = mutable({ inner: {} })

	outer.inner = inner

	// The stored value is the existing mutable proxy, not a new one
	expect(outer.inner).toBe(inner)
})

// --- large numeric increments: only one re-run per change ---------------

await test('mutable - a single assignment triggers exactly one effect run', expect => {
	const state = mutable({ count: 0 })
	let runs = 0

	root(() => {
		syncEffect(() => {
			runs++
			state.count
		})
	})

	expect(runs).toBe(1)

	state.count = 1
	expect(runs).toBe(2)

	state.count = 2
	expect(runs).toBe(3)
})

// --- empty arrays and objects are still reactive ------------------------

await test('mutable - empty object becomes reactive when keys are added', expect => {
	const state = mutable({})
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push('a' in state ? state.a : 'empty')
		})
	})

	expect(seen).toEqual(['empty'])

	state.a = 1

	expect(seen).toEqual(['empty', 1])
})

await test('mutable - empty array becomes reactive when items are pushed', expect => {
	const state = mutable({ list: [] })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.list.length)
		})
	})

	expect(seen).toEqual([0])

	state.list.push('first')

	expect(seen).toEqual([0, 1])
})

// --- Set and WeakMap are blacklisted (not proxied) ----------------------

await test('mutable - Set instances are left untouched (blacklisted)', expect => {
	const set = new Set([1, 2])
	const state = mutable({ tags: set })

	// the set is passed through as-is
	expect(state.tags).toBe(set)
})
