/** @jsxImportSource pota */

/**
 * References:
 * https://github.com/potahtml/pota/tree/master/src/lib/store
 *
 * https://github.com/solidjs/solid/blob/main/packages/solid/store/test/
 * https://github.com/solidjs-community/solid-primitives/tree/main/packages/mutable/test
 * https://github.com/solidjs-community/solid-primitives/blob/main/packages/map/test/index.test.ts
 * https://github.com/vobyjs/oby/blob/master/test/index.js
 * `https://github.com/vuejs/core/tree/main/packages/reactivity/__tests__`
 * https://discord.com/channels/722131463138705510/1217920934548082748
 * ^ https://discord.com/invite/solidjs
 */

import { test as _test } from '#test'
import { isProxy } from 'pota/use/test'

import { batch, memo, root, signal } from 'pota'
import { mutable, merge, replace } from 'pota/store'

const identity = x => x
const copy = x => JSON.parse(JSON.stringify(x))

function testValues(expect, set, get) {
	let callsMemo = 0
	const value = memo(() => {
		callsMemo += 1
		get()
		get()
		get()
		return get()
	})

	expect(callsMemo).toBe(0)

	set(123)
	expect(get()).toBe(123)
	expect(value()).toBe(123)
	expect(callsMemo).toBe(1)

	set(321)
	expect(get()).toBe(321)
	expect(value()).toBe(321)
	expect(callsMemo).toBe(2)

	set(undefined)
	expect(get()).toBe(undefined)
	expect(value()).toBe(undefined)
	expect(callsMemo).toBe(3)

	set(null)
	expect(get()).toBe(null)
	expect(value()).toBe(null)
	expect(callsMemo).toBe(4)

	set(1)
	expect(get()).toBe(1)
	expect(value()).toBe(1)
	expect(callsMemo).toBe(5)

	set('')
	expect(get()).toBe('')
	expect(value()).toBe('')
	expect(callsMemo).toBe(6)

	set('string')
	expect(get()).toBe('string')
	expect(value()).toBe('string')
	expect(callsMemo).toBe(7)

	set([true])
	expect(get()).toEqual([true])
	expect(value()).toEqual([true])
	expect(Array.isArray(get())).toBe(true)
	expect(callsMemo).toBe(8)

	set({ 0: true })
	expect(get()).toEqual({ 0: true })
	expect(value()).toEqual({ 0: true })
	expect(Array.isArray(get())).toBe(false)
	expect(callsMemo).toBe(9)

	set([true])
	expect(get()).toEqual([true])
	expect(value()).toEqual([true])
	expect(Array.isArray(get())).toBe(true)
	expect(callsMemo).toBe(10)

	set({ 0: true })
	expect(get()).toEqual({ 0: true })
	expect(value()).toEqual({ 0: true })
	expect(Array.isArray(get())).toBe(false)
	expect(callsMemo).toBe(11)

	set(true)
	expect(get()).toBe(true)
	expect(value()).toBe(true)
	expect(callsMemo).toBe(12)

	set(false)
	expect(get()).toBe(false)
	expect(value()).toBe(false)
	expect(callsMemo).toBe(13)

	set(Infinity)
	expect(get()).toBe(Infinity)
	expect(value()).toBe(Infinity)
	expect(callsMemo).toBe(14)

	set(Infinity)
	expect(get()).toBe(Infinity)
	expect(value()).toBe(Infinity)
	expect(callsMemo).toBe(14)

	// symbol
	const s = Symbol()

	set(s)
	expect(get()).toBe(s)
	expect(value()).toBe(s)
	expect(callsMemo).toBe(15)

	// bigint
	const bn = BigInt('9007199254740991')
	set(bn)
	expect(get()).toBe(bn)
	expect(value()).toBe(bn)
	expect(callsMemo).toBe(16)

	// built-ins should work and return same value
	const p = Promise.resolve()
	set(p)
	expect(get()).toBe(p)
	expect(value()).toBe(p)
	expect(callsMemo).toBe(17)

	const r = new RegExp('')
	set(r)
	expect(get()).toBe(r)
	expect(value()).toBe(r)
	expect(callsMemo).toBe(18)

	const d = new Date()
	set(d)
	expect(get()).toBe(d)
	expect(value()).toBe(d)
	expect(callsMemo).toBe(19)

	set(NaN)
	expect(Object.is(get(), NaN)).toBe(true)
	expect(Object.is(value(), NaN)).toBe(true)
	expect(callsMemo).toBe(20)

	set(0)
	expect(get()).toBe(0)
	expect(value()).toBe(0)
	expect(callsMemo).toBe(21)

	set(1)
	expect(get()).toBe(1)
	expect(value()).toBe(1)
	expect(callsMemo).toBe(22)
}

// each test runs inside its own root() so cleanups happen on dispose
const test = (title, fn) =>
	_test(title, expect => {
		const dispose = root(dispose => {
			fn(expect)
			return dispose
		})
		dispose()
	})

// detect support for map/set
let supportsMap = false
let supportsSet = false
root(dispose => {
	const map = new Map()
	const set = new Set()
	const result = mutable({ map, set })

	// map
	map.set('key', 1)

	let called1 = 0
	let execute = memo(() => {
		called1++
		result.map.has('key')
	})
	execute()
	result.map.delete('key')
	execute()

	supportsMap = called1 !== 1

	// set
	set.add('key')
	let called2 = 0
	execute = memo(() => {
		called2++
		result.set.has('key')
	})
	execute()
	result.set.delete('key')
	execute()

	supportsSet = called2 !== 1

	dispose()
})

await test('equality: different object', expect => {
	const source = { cat: 'quack' }
	const result = mutable(source)
	expect(result).not.toBe(source)
	expect(isProxy(result)).toBe(true)
	expect(isProxy(source)).toBe(false)
})

await test('equality: different object nested', expect => {
	const source = { cat: 'quack' }
	const result = mutable({ source })
	expect(result.source).not.toBe(source)
	expect(isProxy(result.source)).toBe(true)
})

await test('equality: returns same proxy for proxy', expect => {
	const source = { cat: 'quack' }
	const result1 = mutable(source)
	const result2 = mutable(result1)
	expect(result1).toBe(result2)
	expect(isProxy(result1)).toBe(true)
	expect(isProxy(result2)).toBe(true)
})

await test('equality: doesnt proxy window.location', expect => {
	const source = window.location
	const result1 = mutable(source)
	const result2 = mutable(result1)
	expect(result1).toBe(result2)
	expect(result1).toBe(window.location)
	expect(isProxy(result1)).toBe(false)
	expect(isProxy(result2)).toBe(false)
})

// value

await test('value: object property', expect => {
	const source = { cat: 'quack' }
	const result = mutable(source)

	expect(source.cat).toBe('quack')
	expect(result.cat).toBe('quack')
	expect(isProxy(result)).toBe(true)
})

// mutation

await test('mutation: object property', expect => {
	const source = { cat: 'quack' }
	const result = mutable(source)

	expect(source.cat).toBe('quack')
	expect(result.cat).toBe('quack')

	result.cat = 'murci'
	expect(source.cat).toBe('murci')
	expect(result.cat).toBe('murci')
})

await test('mutation: object nested', expect => {
	const source = mutable({
		data: { starting: 1, ending: 1 },
	})

	expect(source.data.starting).toBe(1)
	expect(source.data.ending).toBe(1)

	source.data.ending = 2
	expect(source.data.starting).toBe(1)
	expect(source.data.ending).toBe(2)

	source.data.starting = 2
	expect(source.data.starting).toBe(2)
	expect(source.data.ending).toBe(2)
})

await test('mutation: object frozen', expect => {
	const source = mutable(
		Object.freeze({
			user: { name: 'John', last: 'Snow' },
		}),
	)

	expect(source.user.name).toBe('John')
	expect(source.user.last).toBe('Snow')

	let called = 0

	const execute = memo(() => {
		source.user.name
		source.user.last
		called++
	})
	execute()
	expect(called).toBe(1)

	expect(() => {
		const anySource = /** @type {any} */ (source)
		anySource.user = 'something else'
	}).toThrow()
	expect(source.user.name).toBe('John')
	expect(source.user.last).toBe('Snow')
})

await test('mutation: object frozen nested', expect => {
	const source = mutable({
		data: Object.freeze({
			user: { name: 'John', last: 'Snow' },
		}),
	})

	let called = 0

	const execute = memo(() => {
		called++

		source.data.user.name
		source.data.user.last
	})
	execute()
	expect(called).toBe(1)

	expect(source.data.user.name).toBe('John')
	expect(source.data.user.last).toBe('Snow')

	expect(() => {
		const anyData = /** @type {any} */ (source.data)
		anyData.user = 'something else'
	}).toThrow()
	expect(source.data.user.name).toBe('John')
	expect(source.data.user.last).toBe('Snow')
})

await test('mutation: object frozen within frozen nested', expect => {
	const source = mutable(
		Object.freeze({
			data: Object.freeze({
				user: { store: { name: 'John', last: 'Snow' } },
			}),
		}),
	)

	let called = 0

	const execute = memo(() => {
		called++

		source.data.user.store.name
		source.data.user.store.last
	})
	execute()
	expect(called).toBe(1)

	expect(source.data.user.store.name).toBe('John')
	expect(source.data.user.store.last).toBe('Snow')

	expect(() => {
		const anyData = /** @type {any} */ (source.data)
		anyData.user = 'something else'
	}).toThrow()
	expect(source.data.user.store.name).toBe('John')
	expect(source.data.user.store.last).toBe('Snow')
})

await test('mutation: function', expect => {
	const result = mutable({
		fn: /** @type {() => number} */ (() => 1),
	})
	let calls = 0
	const getValue = memo(() => {
		calls++
		return result.fn()
	})
	expect(getValue()).toBe(1)
	expect(calls).toBe(1)

	// pota wont trigger changes with functions
	result.fn = () => 2
	expect(getValue()).toBe(2)
	expect(calls).toBe(2)
})

await test('mutation: returned object by function call is mutable', expect => {
	const result = mutable({
		fn: () => ({
			cat: 'quack',
		}),
	})

	expect(result.fn().cat).toBe('quack')

	expect(isProxy(result.fn())).toBe(true)

	const r = result.fn()
	expect(r.cat).toBe('quack')

	let calls = 0
	const execute = memo(() => {
		calls++
		r.cat
	})
	execute()
	expect(calls).toBe(1)

	r.cat = 'murci'
	execute()
	expect(r.cat).toBe('murci')
	expect(calls).toBe(2)
})

// getters

await test('getters: object', expect => {
	const result = mutable({
		cat: 'quack',
		get greeting() {
			return `hi, ${this.cat}`
		},
	})
	expect(result.greeting).toBe('hi, quack')

	result.cat = 'murci'
	expect(result.greeting).toBe('hi, murci')
})

await test('getters: returning object', expect => {
	let value = 'quack'
	const result = mutable({
		/** @returns {any} */
		get greeting() {
			return { greet: `hi, ${value}` }
		},
		set greeting(val) {
			value = val
		},
	})
	expect(result.greeting.greet).toBe('hi, quack')

	result.greeting = 'murci'
	expect(result.greeting.greet).toBe('hi, murci')
})

await test('getters: returning getter', expect => {
	let value = 'quack'
	const result = mutable({
		/** @returns {any} */
		get greeting() {
			return {
				get greet() {
					return `hi, ${value}`
				},
			}
		},
		set greeting(val) {
			value = val
		},
	})
	expect(result.greeting.greet).toBe('hi, quack')

	result.greeting = 'murci'
	expect(result.greeting.greet).toBe('hi, murci')
})

await test('getters: returning frozen object', expect => {
	let value = 'quack'
	const result = mutable({
		/** @returns {any} */
		get greeting() {
			return Object.freeze({ greet: `hi, ${value}` })
		},
		set greeting(val) {
			value = val
		},
	})
	expect(result.greeting.greet).toBe('hi, quack')

	result.greeting = 'murci'
	expect(result.greeting.greet).toBe('hi, murci')
})

await test('getters: returning frozen object nested', expect => {
	let value = 'quack'
	const result = mutable({
		/** @returns {any} */
		get greeting() {
			return Object.freeze({
				greet: Object.freeze({ text: `hi, ${value}` }),
			})
		},
		set greeting(val) {
			value = val
		},
	})
	expect(result.greeting.greet.text).toBe('hi, quack')

	result.greeting = 'murci'
	expect(result.greeting.greet.text).toBe('hi, murci')
})

await test('getter/setters: class', expect => {
	class Cat {
		#name = 'quack'
		get name() {
			return this.#name
		}
		set name(value) {
			this.#name = value
		}
		get greeting() {
			return `hi, ${this.#name}`
		}
	}
	const result = mutable(new Cat())
	expect(result.greeting).toBe('hi, quack')

	result.name = 'mishu'
	expect(result.greeting).toBe('hi, mishu')
})

await test('getter/setters: class 2', expect => {
	class Cat {
		#name = 'quack'
		get name() {
			return this.#name
		}
		set name(value) {
			this.#name = value
		}
		get greeting() {
			return `hi, ${this.#name}`
		}
	}
	const result = mutable(new Cat())
	expect(result.greeting).toBe('hi, quack')
	expect(result.name).toBe('quack')

	let calls = 0
	const execute = memo(() => {
		calls++
		result.name
	})
	execute()
	expect(calls).toBe(1)

	result.name = 'mishu'
	execute()

	expect(result.name).toBe('mishu')
	expect(calls).toBe(2)
	expect(result.greeting).toBe('hi, mishu')
})

await test('getter/setters: class, should fail when trying to set in a getter', expect => {
	class Cat {
		#name = 'quack'
		get name() {
			return this.#name
		}
		get greeting() {
			return `hi, ${this.#name}`
		}
	}
	const result = mutable(new Cat())
	expect(result.greeting).toBe('hi, quack')

	let fail = false
	try {
		/** @type {any} */ result.name = 'mishu'
		fail = true
	} catch (e) {}

	expect(result.greeting).toBe('hi, quack')

	if (fail) {
		throw 'it should have failed to set the value when its only a getter'
	}
})

await test('getter/setters: object', expect => {
	const result = mutable({
		name: 'John',
		last: 'Smith',
		get full() {
			return `${this.name} ${this.last}`
		},
		set full(value) {
			const parts = value.split(' ')
			this.name = parts[0]
			this.last = parts[1]
		},
	})
	expect(result.name).toBe('John')
	expect(result.last).toBe('Smith')
	expect(result.full).toBe('John Smith')

	result.name = 'Jake'
	expect(result.name).toBe('Jake')
	expect(result.last).toBe('Smith')
	expect(result.full).toBe('Jake Smith')

	result.last = 'Lala'
	expect(result.name).toBe('Jake')
	expect(result.last).toBe('Lala')
	expect(result.full).toBe('Jake Lala')

	result.full = 'Bogi One'
	expect(result.name).toBe('Bogi')
	expect(result.last).toBe('One')
	expect(result.full).toBe('Bogi One')
})

// deleting

await test('deleting: undefined object property', expect => {
	const result = mutable({
		name: 'quack',
	})

	expect('last' in result).toBe(false)
	delete result.last
	expect('last' in result).toBe(false)

	expect(result.last).toBe(undefined)
})

await test('deleting: should throw when non-configurable', expect => {
	const result = mutable({})

	Object.defineProperty(result, 'cat', {
		value: 'quack',
		configurable: false,
		writable: false,
	})

	try {
		delete result.cat
		expect('to throw when deleting a non-configurable property').toBe(
			true,
		)
	} catch (e) {}
})

await test('setting to undefined shouldnt delete the property', expect => {
	const result = mutable({
		name: 'quack',
	})
	expect('name' in result).toBe(true)

	result.name = undefined
	expect('name' in result).toBe(true)
	expect(result.name).toBe(undefined)
	expect('name' in result).toBe(true)

	delete result.name
	expect('name' in result).toBe(false)
	expect(result.name).toBe(undefined)
	expect('name' in result).toBe(false)
})

await test('delete key with undefined value does trigger reactivity - object.keys', expect => {
	const result = mutable({ a: 'somevalue', b: undefined })
	expect('a' in result).toBe(true)
	expect('b' in result).toBe(true)

	let calls = 0
	const execute = memo(() => {
		calls++
		Object.keys(result)
	})
	execute()
	expect(calls).toBe(1)

	delete result.b
	execute()
	expect(calls).toBe(2)
	expect('b' in result).toBe(false)
})

await test('delete non existent key doesnt trigger reactivity - object.keys', expect => {
	const result = mutable({ a: 'somevalue' })
	expect('a' in result).toBe(true)
	expect('b' in result).toBe(false)

	let calls = 0
	const execute = memo(() => {
		calls++
		Object.keys(result)
	})
	execute()
	expect(calls).toBe(1)

	expect('b' in result).toBe(false)
	expect(calls).toBe(1)

	delete result.b
	execute()
	expect('b' in result).toBe(false)
	expect(calls).toBe(1)
})

await test('delete non existent key doesnt trigger reactivity - value', expect => {
	const result = mutable({ a: 'somevalue' })
	expect('a' in result).toBe(true)
	expect('b' in result).toBe(false)

	let calls = 0
	const execute = memo(() => {
		calls++
		result.b
	})
	execute()
	expect(calls).toBe(1)

	expect('b' in result).toBe(false)
	expect(calls).toBe(1)

	delete result.b
	execute()
	expect('b' in result).toBe(false)
	expect(calls).toBe(1)
})

await test('delete non existent key doesnt trigger reactivity - in', expect => {
	const result = mutable({ a: 'somevalue' })
	expect('a' in result).toBe(true)
	expect('b' in result).toBe(false)

	let calls = 0
	const execute = memo(() => {
		calls++
		'b' in result
	})
	execute()
	expect(calls).toBe(1)

	expect('b' in result).toBe(false)
	expect(calls).toBe(1)

	delete result.b
	execute()
	expect('b' in result).toBe(false)
	expect(calls).toBe(1)
})

await test('delete key with defined value does trigger reactivity - object.keys', expect => {
	const result = mutable({ a: 'somevalue', b: undefined })
	expect('a' in result).toBe(true)
	expect('b' in result).toBe(true)

	let calls = 0
	const execute = memo(() => {
		calls++
		Object.keys(result)
	})
	execute()
	expect(calls).toBe(1)

	delete result.a
	execute()
	expect('a' in result).toBe(false)
	expect(calls).toBe(2)
})

await test('delete key with undefined value does not trigger reactivity - reading', expect => {
	const result = mutable({ a: 'somevalue', b: undefined })
	expect('a' in result).toBe(true)
	expect('b' in result).toBe(true)

	let calls = 0
	const execute = memo(() => {
		calls++
		result.b
	})
	execute()
	expect(calls).toBe(1)

	delete result.b
	execute()
	expect('b' in result).toBe(false)
	expect(calls).toBe(1)
})

await test('delete key with undefined value does trigger reactivity - in', expect => {
	const result = mutable({ a: 'somevalue', b: undefined })
	expect('a' in result).toBe(true)
	expect('b' in result).toBe(true)

	let calls = 0
	const execute = memo(() => {
		calls++
		'b' in result
	})
	execute()
	expect(calls).toBe(1)

	delete result.b
	execute()
	expect('b' in result).toBe(false)
	expect(calls).toBe(2)
})

await test('delete key with defined value does trigger reactivity - reading', expect => {
	const result = mutable({ a: 'somevalue', b: undefined })
	expect('a' in result).toBe(true)
	expect('b' in result).toBe(true)

	let calls = 0
	const execute = memo(() => {
		calls++
		result.a
	})
	execute()
	expect(calls).toBe(1)

	delete result.a
	execute()
	expect('a' in result).toBe(false)
	expect(calls).toBe(2)
})

await test('deleting: defined object property', expect => {
	const source = { name: 'quack', last: 'murci' }
	const result = mutable(source)

	expect(result.name).toBe('quack')
	expect(result.last).toBe('murci')

	expect('name' in result).toBe(true)
	expect('last' in result).toBe(true)

	delete result.name

	expect('name' in result).toBe(false)
	expect('last' in result).toBe(true)

	expect(result.name).toBe(undefined)
	expect(result.last).toBe('murci')

	expect('name' in result).toBe(false)
	expect('last' in result).toBe(true)

	expect(result.name).toBe(undefined)
	expect(result.last).toBe('murci')
})

// Date, HTMLElement, RegExp

await test('should trigger only once', expect => {
	const result = mutable({ a: 1 })
	expect('a' in result).toBe(true)

	let calls = 0
	let tmp
	const execute = memo(() => {
		calls++
		tmp = { ...result }
	})
	execute()
	expect(calls).toBe(1)

	execute()
	expect(calls).toBe(1)

	result.a = 333
	execute()
	expect(calls).toBe(2)

	result.a = 333
	execute()
	expect(calls).toBe(2)
	expect(result.a).toBe(333)
})

/* misc */

await test('misc objects', expect => {
	// Date, HTMLElement, RegExp

	const sources = [
		new Date(),
		/[a-z]/,
		document.createElement('div'),
		new Set([1, 2, 3]),
		new Map(),
		Symbol(),
	]
	for (const source of sources) {
		try {
			const result = mutable(source)
			if (result instanceof Map && supportsMap) {
				expect(result).not.toBe(source)
				expect(isProxy(result)).toBe(true)
			} else if (result instanceof Set && supportsSet) {
				expect(result).not.toBe(source)
				expect(isProxy(result)).toBe(true)
			} else {
				expect(result).toBe(source)
				expect(isProxy(result)).toBe(false)
			}
		} catch (e) {
			console.error('misc objects: Throws with', source)
		}
	}
})

await test('misc objects (nested)', expect => {
	const sources = [
		new Date(),
		/[a-z]/,
		document.createElement('div'),
		new Set([1, 2, 3]),
		new Map(),
		Symbol(),
	]
	for (const source of sources) {
		try {
			const result = mutable({ o: source })
			if (result.o instanceof Map && supportsMap) {
				expect(result.o).not.toBe(source)
				expect(isProxy(result.o)).toBe(true)
			} else if (result.o instanceof Set && supportsSet) {
				expect(result.o).not.toBe(source)
				expect(isProxy(result.o)).toBe(true)
			} else {
				expect(result.o).toBe(source)
				expect(isProxy(result.o)).toBe(false)
			}
		} catch (e) {
			console.error(
				'misc objects (nested): throws having nested',
				source,
			)
		}
	}

	const source = {}
	const result = mutable({ o: source })
	expect(result.o).not.toBe(source)
	expect(isProxy(result.o)).toBe(true)
})

await test('misc native objects should work', expect => {
	const result = mutable({ set: new Set(), map: new Map() })

	expect(result.set instanceof Set).toBe(true)
	expect(result.map instanceof Map).toBe(true)
	expect(isProxy(result.set)).toBe(supportsSet ? true : false)

	expect(isProxy(result.map)).toBe(supportsMap ? true : false)

	result.set.add(1)
	result.set.delete(2)
	result.set.delete(1)
	result.set.clear()

	result.map.set(1, 1)
	result.map.delete(1)
	result.map.clear()
})

await test('misc objects (effect)', expect => {
	const sources = [new Date(), /[a-z]/, document.createElement('div')]
	for (const source of sources) {
		const result = /** @type {{ o: Record<string, any> }} */ (
			mutable({ o: source })
		)

		expect(result.o).toBe(source)
		expect(isProxy(result.o)).toBe(false)

		let calls = 0
		const execute1 = memo(() => {
			calls++
			result.o.something
		})
		execute1()
		expect(calls).toBe(1)

		result.o.something = true
		result.o.something = false
		execute1()
		expect(calls).toBe(1)

		delete result.o.something
		execute1()
		expect(calls).toBe(1)

		result.o.something = true
		result.o.something = false
		execute1()
		expect(calls).toBe(1)

		// again but when reading its defined already
		const execute2 = memo(() => {
			calls++
			result.o.something
		})
		execute1(), execute2()
		expect(calls).toBe(2)

		result.o.something = true
		result.o.something = false
		execute1(), execute2()
		expect(calls).toBe(2)

		delete result.o.something
		execute1(), execute2()
		expect(calls).toBe(2)

		result.o.something = true
		result.o.something = false
		execute1(), execute2()
		expect(calls).toBe(2)
	}
})

/* in */

await test('in: getters to not be called 1', expect => {
	let access = 0
	const result = mutable({
		a: 1,
		get b() {
			console.log('accesing b')
			access++
			return 2
		},
	})

	expect('a' in result).toBe(true)
	expect('b' in result).toBe(true)
	expect('c' in result).toBe(false)
	expect(access).toBe(0)
})

await test('in: getters to not be called 2', expect => {
	let access = 0
	const result = mutable({
		a: 1,
		get b() {
			console.log('accesing b')
			access++
			return 2
		},
	})
	result.c = 0

	expect('a' in result).toBe(true)
	expect('b' in result).toBe(true)
	expect('c' in result).toBe(true)
	expect(access).toBe(0)
})

await test('in: getters to not be called 3', expect => {
	let access = 0
	const result = mutable({
		a: 1,
		get b() {
			// console.log('accesing b')
			access++
			return 2
		},
	})

	let failed = false
	try {
		/** @type {any} */ result.b = 0
	} catch (e) {
		failed = true
	}
	if (!failed) {
		throw 'setting a value when its only a getter should have throw'
	}

	expect(access).toBe(0)
	expect('a' in result).toBe(true)
	expect('b' in result).toBe(true)
	expect(access).toBe(0)
})

await test('in: getters to not be called 3.1', expect => {
	let access = 0
	let val = 2
	const result = mutable({
		a: 1,
		get b() {
			// console.log('accesing b')
			access++
			return val
		},
		set b(value) {
			val = value
		},
	})

	expect(access).toBe(0)
	expect('a' in result).toBe(true)
	expect('b' in result).toBe(true)
	expect(access).toBe(0)

	expect(result.b).toBe(2)
	expect(access).toBe(1)

	result.b = 3

	expect(result.b).toBe(3)
	expect(access).toBe(2)
})

await test('in: getters to not be called 4', expect => {
	let access = 0
	const result = mutable({
		a: 1,
		get b() {
			access++
			return 2
		},
	})

	expect(access).toBe(0)
	expect('a' in result).toBe(true)
	expect('b' in result).toBe(true)
	expect(access).toBe(0)

	delete (/** @type {any} */ (result).b)

	expect('a' in result).toBe(true)
	expect('b' in result).toBe(false)
	expect(access).toBe(0)

	result.b

	expect('a' in result).toBe(true)
	expect('b' in result).toBe(false)
	expect(access).toBe(0)
	/** @type {any} */
	result.b = 3

	expect('a' in result).toBe(true)
	expect('b' in result).toBe(true)
	expect(result.b).toBe(3)
	expect(access).toBe(0)
})

/* tracking */

await test('track: value', expect => {
	const source = { name: 'quack' }
	const result = mutable(source)

	let called = 0
	const execute = memo(() => {
		called++
		result.name
	})
	execute()

	// setting to same value
	result.name = 'quack'
	execute()
	expect(called).toBe(1)
	expect(result.name).toBe('quack')

	// change
	result.name = 'murci'
	execute()
	expect(called).toBe(2)
	expect(result.name).toBe('murci')

	// same value again should not retrigger
	result.name = 'murci'
	execute()
	expect(called).toBe(2)
	expect(result.name).toBe('murci')

	// third
	result.name = 'mishu'
	execute()
	expect(called).toBe(3)
	expect(result.name).toBe('mishu')
})

await test('track: value nested', expect => {
	const source = { data: { name: 'quack' } }
	const result = mutable(source)

	let called = 0
	const execute = memo(() => {
		called++
		result.data.name
	})
	execute()

	// same value again should not retrigger
	result.data.name = 'quack'
	execute()
	expect(called).toBe(1)
	expect(result.data.name).toBe('quack')

	result.data.name = 'murci'
	execute()
	expect(called).toBe(2)
	expect(result.data.name).toBe('murci')

	// same value again should not retrigger
	result.data.name = 'murci'
	execute()
	expect(called).toBe(2)
	expect(result.data.name).toBe('murci')

	// third
	result.data.name = 'mishu'
	execute()
	expect(called).toBe(3)
	expect(result.data.name).toBe('mishu')
})

await test('track: undefined value', expect => {
	const source = {}
	const result = mutable(source)

	let called = 0
	const execute = memo(() => {
		called++
		result.name
	})
	execute()
	expect(called).toBe(1)

	result.name = 'murci'
	execute()
	expect(called).toBe(2)
	expect(result.name).toBe('murci')

	// same value again should not retrigger
	result.name = 'murci'
	execute()
	expect(called).toBe(2)
	expect(result.name).toBe('murci')

	delete result.name
	execute()
	expect(called).toBe(3)
	expect('name' in result).toBe(false)
	expect(called).toBe(3)

	/**
	 * Tricky because signal gets deleted(see previous lines), then we
	 * add it again with the following, but the signal is not the same
	 * one as before, so effect doesnt re-trigger
	 */
	result.name = 'mishu'
	execute()
	expect(called).toBe(4)
})

await test('track: deleted value', expect => {
	const source = { name: 'hola' }
	const result = mutable(source)

	let called = 0
	const execute = memo(() => {
		called++
		result.name
	})
	execute()
	expect(called).toBe(1)

	result.name = 'murci'
	execute()
	expect(called).toBe(2)
	expect(result.name).toBe('murci')

	delete result.name
	execute()
	expect(called).toBe(3)
	expect('name' in result).toBe(false)
	expect(called).toBe(3)

	/**
	 * Tricky because signal gets deleted(see previous lines), then we
	 * add it again with the following, but the signal is not the same
	 * one as before, so effect doesnt re-trigger
	 */
	result.name = 'mishu'
	execute()
	expect(called).toBe(4)
})

await test('track: undefined value nested', expect => {
	const source = {}
	const result = mutable(source)

	let called = 0
	const execute = memo(() => {
		called++
		result.data
	})
	execute()
	expect(called).toBe(1)

	result.data = {}
	execute()
	result.data.name = 'murci'
	execute()
	result.data.name = 'murci'
	execute()
	expect(called).toBe(2)
	expect(result.data.name).toBe('murci')
})

await test('track: state from signal', expect => {
	const [read, write] = signal('init')
	const result = mutable({ data: '' })

	let called = 0
	const execute = memo(() => {
		called++
		result.data = read()
	})
	execute()
	expect(called).toBe(1)
	expect(result.data).toBe('init')

	write('signal')
	execute()
	expect(called).toBe(2)
	expect(result.data).toBe('signal')
})

await test('track `in`', expect => {
	let access = 0
	const result = mutable({
		/** @type {number | boolean} */
		a: 1,
		get b() {
			access++
			return 2
		},
	})

	let called = 0
	const execute = memo(() => {
		'a' in result
		'b' in result
		called++
	})
	execute()
	expect(called).toBe(1)

	delete (/** @type {any} */ (result).a)
	execute()
	expect(called).toBe(2)
	expect('a' in result).toBe(false)
	expect(called).toBe(2)

	result.a = true
	execute()
	expect(called).toBe(3)

	execute()
	expect(access).toBe(0)
	execute()
})

/* classes */

await test('read and set class', expect => {
	class D {
		f = 1
		get e() {
			return this.f * 4
		}
	}
	class A {
		a = 1
		get b() {
			return this.a * 4
		}
		child = new D()
	}
	let count = 0
	let childCount = 0

	const m = mutable(new A())

	const execute1 = memo(() => {
		m.b
		count++
	})
	execute1()
	const execute2 = memo(() => {
		m.child.f
		childCount++
	})
	execute2()

	const increment = () => {
		m.a++
		m.child.f++
		execute1()
		execute2()
	}

	// initial
	expect(m.b).toBe(4)
	expect(m.child.e).toBe(4)
	expect(count).toBe(1)
	expect(childCount).toBe(1)

	// incrementing
	increment()
	expect(m.b).toBe(8)
	expect(m.child.e).toBe(8)
	expect(count).toBe(2)
	expect(childCount).toBe(2)

	increment()
	expect(m.b).toBe(12)
	expect(m.child.e).toBe(12)
	expect(count).toBe(3)
	expect(childCount).toBe(3)

	increment()
	expect(m.b).toBe(16)
	expect(m.child.e).toBe(16)
	expect(count).toBe(4)
	expect(childCount).toBe(4)
})

await test('read and set outside class', expect => {
	const m = mutable({
		a: 1,
		get b() {
			return this.a * 4
		},
	})

	let calls = 0
	const execute = memo(() => {
		m.b
		calls++
	})
	execute()

	const increment = () => {
		m.a++
		execute()
	}

	// initial
	expect(m.a).toBe(1)
	expect(m.b).toBe(4)
	expect(calls).toBe(1)

	// incrementing
	increment()
	expect(m.a).toBe(2)
	expect(m.b).toBe(8)
	expect(calls).toBe(2)

	increment()
	expect(m.a).toBe(3)
	expect(m.b).toBe(12)
	expect(calls).toBe(3)
})

await test('read and set inside class', expect => {
	class Test {
		a = 1
		get b() {
			return this.a * 4
		}
	}

	const m = mutable(new Test())

	let calls = 0
	const execute = memo(() => {
		m.b
		calls++
	})
	execute()
	expect(calls).toBe(1)

	const increment = () => {
		m.a++
		execute()
	}

	// initial
	expect(m.a).toBe(1)
	expect(m.b).toBe(4)

	// incrementing
	increment()
	expect(calls).toBe(2)
	expect(m.a).toBe(2)
	expect(m.b).toBe(8)

	increment()
	expect(m.a).toBe(3)
	expect(m.b).toBe(12)
	expect(calls).toBe(3)
})

await test('read and set inside extended class', expect => {
	class Tests2 {
		/** @type {number} */
		a
		get b() {
			return this.a * 4
		}
		get logA() {
			return this.a
		}
	}
	class Test extends Tests2 {
		a = 1
	}

	const m = mutable(new Test())

	let calls = 0
	const execute = memo(() => {
		m.b
		calls++
	})
	execute()

	const increment = () => {
		m.a++
		execute()
	}

	// initial
	expect(m.a).toBe(1)
	expect(m.logA).toBe(1)
	expect(m.b).toBe(4)
	expect(calls).toBe(1)

	// incrementing
	increment()
	expect(m.a).toBe(2)
	expect(m.b).toBe(8)
	expect(calls).toBe(2)

	increment()
	expect(m.a).toBe(3)
	expect(m.b).toBe(12)
	expect(calls).toBe(3)
})

await test('read and set inside extended x2 class', expect => {
	class Test4 {
		/** @type {number} */
		a
		get b() {
			return this.a * 4
		}
		get logA() {
			return this.a
		}
	}
	class Test3 extends Test4 {}
	class Tests2 extends Test3 {
		a = 1
	}
	class Test extends Tests2 {}

	const m = mutable(new Test())

	let calls = 0
	const execute = memo(() => {
		m.b
		calls++
	})
	execute()

	const increment = () => {
		m.a++
		execute()
	}

	// initial
	expect(m.a).toBe(1)
	expect(m.logA).toBe(1)
	expect(m.b).toBe(4)
	expect(calls).toBe(1)

	// incrementing
	increment()
	expect(m.a).toBe(2)
	expect(m.b).toBe(8)
	expect(calls).toBe(2)

	increment()
	expect(m.a).toBe(3)
	expect(m.b).toBe(12)
	expect(calls).toBe(3)
})

await test('hasOwnProperty shoulnt throw', expect => {
	let m = mutable({ a: { deep: 'test' } })
	m.hasOwnProperty('a')
	m.a.hasOwnProperty('deep')

	m = mutable(Object.create(null))
	m.a = { deep: 'test' }
	// m.hasOwnProperty('a')
	m.a.hasOwnProperty('deep')
})

await test('reacts to hasOwnProperty', expect => {
	let m = mutable({ a: { deep: 'test' }, c: {} })

	let has

	let calls1 = 0
	const execute1 = memo(() => {
		calls1++
		has = m.hasOwnProperty('b')
	})

	let calls2 = 0
	const execute2 = memo(() => {
		calls2++
		has = m.a.hasOwnProperty('b')
	})

	let calls3 = 0
	const execute3 = memo(() => {
		calls3++
		has = Object.hasOwn(m, 'z')
	})

	execute1(), execute2(), execute3()
	expect(calls1).toBe(1)
	expect(calls2).toBe(1)
	expect(calls3).toBe(1)
	expect(has).toBe(false)

	m.b = 1
	execute1(), execute2(), execute3()
	expect(calls1).toBe(2)
	expect(calls2).toBe(1)
	expect(calls3).toBe(1)
	expect(has).toBe(true)
	has = false
	expect(has).toBe(false)

	m.a.b = 1
	execute1(), execute2(), execute3()
	expect(calls1).toBe(2)
	expect(calls2).toBe(2)
	expect(calls3).toBe(1)
	expect(has).toBe(true)
	has = false
	expect(has).toBe(false)

	m.z = 1
	execute1(), execute2(), execute3()
	expect(calls1).toBe(2)
	expect(calls2).toBe(2)
	expect(calls3).toBe(2)
	expect(has).toBe(true)
})

// oby test suite

await test('is both a getter and a setter, for shallow primitive properties', expect => {
	const o = mutable({ value: undefined })
	expect(o.value).toBe(undefined)

	testValues(
		expect,
		v => {
			o.value = v
		},
		() => o.value,
	)
})

await test('Object.create(null)', expect => {
	const o = mutable(Object.create(null))

	expect(o.value).toBe(undefined)

	testValues(
		expect,
		v => {
			o.value = v
		},
		() => o.value,
	)
})

await test('Object.create(null) nested', expect => {
	const o = mutable({ value: Object.create(null) })
	expect(o.value).not.toBe(undefined)
	expect(o.value.deep).toBe(undefined)

	testValues(
		expect,
		v => {
			o.value.deep = v
		},
		() => o.value.deep,
	)
})

await test('deeper: is both a getter and a setter, for shallow primitive properties', expect => {
	const o = mutable({ value: { deeper: undefined } })
	expect(o.value.deeper).toBe(undefined)

	testValues(
		expect,
		v => {
			o.value.deeper = v
		},
		() => o.value.deeper,
	)
})

await test('is both a getter and a setter, for shallow non-primitive properties', expect => {
	/** @type {{ foo?: number }} */
	const obj1 = { foo: 123 }
	/** @type {{ foo?: number }} */
	const obj2 = {}

	const o = mutable({ value: obj1 })
	expect(o.value).toEqual(obj1)

	o.value = obj2
	expect(o.value).toEqual(obj2)

	o.value = obj1
	expect(o.value).toEqual(obj1)

	testValues(
		expect,
		v => {
			o.value = v
		},
		() => o.value,
	)
})

await test('is both a getter and a setter, for deep primitive properties', expect => {
	const o = mutable({ deep: { value: undefined } })
	expect(o.deep.value).toBe(undefined)

	testValues(
		expect,
		v => {
			o.deep.value = v
		},
		() => o.deep.value,
	)
})

await test('is both a getter and a setter, for deep non-primitive properties', expect => {
	/** @type {{ foo?: number }} */
	const obj1 = { foo: 123 }
	/** @type {{ foo?: number }} */
	const obj2 = {}

	const o = mutable({ deep: { value: obj1 } })
	expect(o.deep.value).toEqual(obj1)

	o.deep.value = obj2
	expect(o.deep.value).toEqual(obj2)

	o.deep.value = obj1
	expect(o.deep.value).toEqual(obj1)

	testValues(
		expect,
		v => {
			o.deep.value = v
		},
		() => o.deep.value,
	)
})

await test('is both a getter and a setter, for deep non-primitive properties (memo)', expect => {
	/** @type {{ foo?: number }} */
	const obj1 = { foo: 123 }
	/** @type {{ foo?: number }} */
	const obj2 = {}

	const o = mutable({ deep: { value: obj1 } })
	expect(o.deep.value).toEqual(obj1)

	let calls = 0
	const execute = memo(() => {
		calls += 1
		o.deep.value
	})
	execute()
	expect(calls).toBe(1)

	o.deep.value = obj2
	execute()
	expect(o.deep.value).toEqual(obj2)
	expect(calls).toBe(2)

	o.deep.value = obj1
	execute()
	expect(o.deep.value).toEqual(obj1)
	expect(calls).toBe(3)

	testValues(
		expect,
		v => {
			o.deep.value = v
		},
		() => o.deep.value,
	)
})

await test('creates a dependency in a memo when getting a shallow property', expect => {
	const o = mutable({ value: 1 })

	testValues(
		expect,
		v => {
			o.value = v
		},
		() => o.value,
	)
})

await test('creates a dependency in a memo when getting a deep property', expect => {
	const o = mutable({ deep: { value: 1 } })

	testValues(
		expect,
		v => {
			o.deep.value = v
		},
		() => o.deep.value,
	)
})

await test('creates a single dependency in an memo even if getting a shallow property multiple times', expect => {
	const o = mutable({ value: 1 })

	let calls = 0

	const value = memo(() => {
		calls += 1
		o.value
		o.value
		o.value
		return o.value
	})

	expect(value()).toBe(1)
	expect(calls).toBe(1)

	o.value = 2

	expect(value()).toBe(2)
	expect(calls).toBe(2)

	o.value = 3

	expect(value()).toBe(3)
	expect(calls).toBe(3)

	testValues(
		expect,
		v => {
			o.value = v
		},
		() => o.value,
	)
})

await test('creates a single dependency even if getting a shallow property multiple times', expect => {
	const o = mutable({ value: 1 })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.value
		o.value
		o.value
	})
	execute()
	expect(calls).toBe(1)

	o.value = 2
	execute()
	expect(calls).toBe(2)

	o.value = 3
	execute()
	expect(calls).toBe(3)

	testValues(
		expect,
		v => {
			o.value = v
		},
		() => o.value,
	)
})

await test('creates a single dependency in a memo even if getting a deep property multiple times', expect => {
	const o = mutable({ deep: { value: 1 } })

	let calls = 0

	const value = memo(() => {
		calls += 1
		o.deep.value
		o.deep.value
		o.deep.value
		return o.deep.value
	})

	expect(value()).toBe(1)
	expect(calls).toBe(1)

	o.deep.value = 2

	expect(value()).toBe(2)
	expect(calls).toBe(2)

	o.deep.value = 3

	expect(value()).toBe(3)
	expect(calls).toBe(3)

	testValues(
		expect,
		v => {
			o.deep.value = v
		},
		() => o.deep.value,
	)
})

await test('creates a single dependency in an effect even if getting a deep property multiple times', expect => {
	const o = mutable({ deep: { value: 1 } })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.deep.value
		o.deep.value
		o.deep.value
	})
	execute()
	expect(calls).toBe(1)

	o.deep.value = 2
	execute()
	expect(calls).toBe(2)

	o.deep.value = 3
	execute()
	expect(calls).toBe(3)

	testValues(
		expect,
		v => {
			o.deep.value = v
		},
		() => o.deep.value,
	)
})

await test('does not create a dependency in a memo when creating', expect => {
	/** @type {{ value: any } | undefined} */
	let o
	let calls = 0

	const value = memo(() => {
		calls += 1
		o = mutable({ value: /** @type {any} */ (1) })
	})

	expect(value()).toBe(undefined)
	expect(calls).toBe(1)

	o.value = 2

	expect(value()).toBe(undefined)
	expect(calls).toBe(1)

	testValues(
		expect,
		v => {
			o.value = v
		},
		() => o.value,
	)

	expect(calls).toBe(1)
})

await test('does not create a dependency in an effect when creating', expect => {
	/** @type {{ value: any } | undefined} */
	let o
	let calls = 0

	const execute = memo(() => {
		calls += 1
		o = mutable({ value: /** @type {any} */ (1) })
	})
	execute()
	expect(calls).toBe(1)

	o.value = 2
	execute()
	expect(calls).toBe(1)

	testValues(
		expect,
		v => {
			o.value = v
		},
		() => o.value,
	)

	expect(calls).toBe(1)
})

await test('does not create a dependency in a memo when setting a shallow property', expect => {
	let o = mutable({ value: 0 })
	let calls = 0

	const value = memo(() => {
		calls += 1
		o.value = 1
	})

	expect(value()).toBe(undefined)
	expect(calls).toBe(1)

	o.value = 2

	expect(value()).toBe(undefined)
	expect(calls).toBe(1)

	testValues(
		expect,
		v => {
			o.value = v
		},
		() => o.value,
	)
})

await test('does not create a dependency in an effect when setting a shallow property', expect => {
	let o = mutable({ value: 0 })
	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.value = 1
	})
	execute()
	expect(calls).toBe(1)

	o.value = 2
	execute()
	expect(calls).toBe(1)

	testValues(
		expect,
		v => {
			o.value = v
		},
		() => o.value,
	)
})

await test('does not create a dependency in a memo when getting a parent property of the one being updated', expect => {
	const o = mutable({ deep: { value: 1 } })

	let calls = 0

	const value = memo(() => {
		calls += 1
		o.deep
	})

	expect(value()).toBe(undefined)
	expect(calls).toBe(1)

	o.deep.value = 2

	expect(value()).toBe(undefined)
	expect(calls).toBe(1)

	o.deep.value = 3

	expect(value()).toBe(undefined)
	expect(calls).toBe(1)

	testValues(
		expect,
		v => {
			o.deep.value = v
		},
		() => o.deep.value,
	)
})

await test('does not create a dependency in an effect when getting a parent property of the one being updated', expect => {
	const o = mutable({ deep: { value: 1 } })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.deep
	})
	execute()
	expect(calls).toBe(1)

	o.deep.value = 2
	execute()
	expect(calls).toBe(1)

	o.deep.value = 3
	execute()
	expect(calls).toBe(1)

	testValues(
		expect,
		v => {
			o.deep = v
		},
		() => o.deep,
	)
})

await test('does create a dependency (on the parent) in a memo when setting a deep property', expect => {
	//FIXME: This can't quite be fixed, it's a quirk of how mutable stores work

	const o = mutable({ deep: { value: 1 } })

	let calls = 0

	const value = memo(() => {
		calls += 1
		o.deep.value = 2
	})

	expect(value()).toBe(undefined)
	expect(calls).toBe(1)

	o.deep.value = 3
	expect(value()).toBe(undefined)
	expect(calls).toBe(1)

	testValues(
		expect,
		v => {
			o.deep.value = v
		},
		() => o.deep.value,
	)
	/** @type {any} */
	o.deep.value = undefined
	o.deep = /** @type {any} */ ({})
	expect(value()).toBe(undefined)
	expect(calls).toBe(2)
})

await test('does create a dependency (on the parent) in an effect when setting a deep property', expect => {
	//FIXME: This can't quite be fixed, it's a quirk of how mutable stores work

	const o = mutable({ deep: { value: 1 } })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.deep.value = 2
	})
	execute()
	expect(calls).toBe(1)

	o.deep.value = 3
	execute()
	expect(calls).toBe(1)

	testValues(
		expect,
		v => {
			o.deep.value = v
		},
		() => o.deep.value,
	)

	o.deep = /** @type {any} */ ({})
	execute()
	expect(calls).toBe(2)
})

await test('returns primitive values as is', expect => {
	/** @type {any} */
	let o = mutable(123)
	expect(o).toBe(123)

	o = mutable(321)
	expect(o).toBe(321)

	o = mutable(undefined)
	expect(o).toBe(undefined)

	o = mutable(null)
	expect(o).toBe(null)

	o = mutable('')
	expect(o).toBe('')

	o = mutable('string')
	expect(o).toBe('string')

	o = mutable(true)
	expect(o).toBe(true)

	o = mutable(false)
	expect(o).toBe(false)

	o = mutable(Infinity)
	expect(o).toBe(Infinity)

	o = mutable([true])
	expect(o).toEqual([true])

	o = mutable({ 0: true })
	expect(o).toEqual({ 0: true })

	o = mutable([true])
	expect(o).toEqual([true])

	o = mutable({ 0: true })
	expect(o).toEqual({ 0: true })
})

await test('returns unproxied "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toSource", "toString", "valueOf", properties', expect => {
	const o = /** @type {any} */ (mutable({}))

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.hasOwnProperty
		o.isPrototypeOf
		o.propertyIsEnumerable
		o.toLocaleString
		o.toSource
		o.toString
		o.valueOf
	})
	execute()

	expect(calls).toBe(1)

	o.hasOwnProperty = 1
	o.isPrototypeOf = 1
	o.propertyIsEnumerable = 1
	o.toLocaleString = 1
	o.toSource = 1
	o.toString = 1
	o.valueOf = 1
	execute()

	expect(calls).toBe(2)
})

await test('returns the value being set', expect => {
	const o = mutable(
		/** @type {{ value: any }} */ ({ value: undefined }),
	)

	expect((o.value = 123)).toBe(123)
	expect((o.value = undefined)).toBe(undefined)
	expect((o.value = null)).toBe(null)
	expect((o.value = '')).toBe('')
	expect((o.value = 'string')).toBe('string')
	expect((o.value = [true])).toEqual([true])
	expect((o.value = { 0: true })).toEqual({ 0: true })
	expect((o.value = true)).toBe(true)
	expect((o.value = false)).toBe(false)
	expect((o.value = Infinity)).toBe(Infinity)
	expect((o.value = 0)).toBe(0)
	expect(Object.is((o.value = NaN), NaN)).toBe(true)
	expect((o.value = 1)).toBe(1)
})

await test('supports setting functions', expect => {
	const fn = () => {}
	const o = mutable({ value: () => {} })

	o.value = fn
	// pota will return wrapped functions
	expect(typeof o.value).toBe('function')
})

await test('supports wrapping a plain object', expect => {
	const o = /** @type {Record<string, any>} */ (mutable({}))

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.value
	})
	execute()
	expect(calls).toBe(1)

	o.value = 2
	execute()
	expect(calls).toBe(2)
})

await test('supports wrapping a deep plain object inside a plain object', expect => {
	const o = /** @type {{ value: Record<string, any> }} */ (
		mutable({ value: {} })
	)

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.value.lala
	})
	execute()
	expect(calls).toBe(1)

	o.value.lala = 3
	execute()
	expect(calls).toBe(2)
	expect(o.value.lala).toBe(3)

	testValues(
		expect,
		v => {
			o.value.lala = v
		},
		() => o.value.lala,
	)
})

await test('supports reacting to deleting a shallow property', expect => {
	const o = mutable(/** @type {{ value: any }} */ ({ value: 123 }))

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.value
	})
	execute()
	expect(calls).toBe(1)

	delete o.value
	execute()
	expect(calls).toBe(2)
	expect('value' in o).toBe(false)
	expect(calls).toBe(2)

	o.value = undefined
	execute()
	expect(calls).toBe(2)

	o.value = true
	execute()
	expect(calls).toBe(3)

	testValues(
		expect,
		v => {
			o.value = v
		},
		() => o.value,
	)
})

await test('supports not reacting when deleting a shallow property that was undefined', expect => {
	const o = mutable({ value: undefined })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.value
	})
	execute()
	expect(calls).toBe(1)

	delete o.value
	execute()
	expect(calls).toBe(1)
	expect('value' in o).toBe(false)
	expect(calls).toBe(1)

	o.value = undefined
	execute()
	expect(calls).toBe(1)

	o.value = true
	execute()
	expect(calls).toBe(2)

	testValues(
		expect,
		v => {
			o.value = v
		},
		() => o.value,
	)
})

await test('supports reacting when deleting a shallow property that was null', expect => {
	const o = mutable({ value: null })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.value
	})
	execute()
	expect(calls).toBe(1)

	delete o.value
	execute()
	expect(calls).toBe(2)

	expect('value' in o).toBe(false)
	expect(calls).toBe(2)

	o.value = undefined
	execute()
	expect(calls).toBe(2)

	o.value = true
	execute()
	expect(calls).toBe(3)

	testValues(
		expect,
		v => {
			o.value = v
		},
		() => o.value,
	)
})

await test('supports reacting to deleting a deep property', expect => {
	const o = mutable(
		/** @type {{ deep: { value: any } }} */ ({
			deep: { value: 123 },
		}),
	)

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.deep.value
	})
	execute()
	expect(calls).toBe(1)

	delete o.deep.value
	execute()
	expect(calls).toBe(2)

	expect('value' in o.deep).toBe(false)
	expect(calls).toBe(2)

	o.deep.value = undefined
	execute()
	expect(calls).toBe(2)

	o.deep.value = true
	execute()
	expect(calls).toBe(3)

	testValues(
		expect,
		v => {
			o.deep.value = v
		},
		() => o.deep.value,
	)
})

await test('supports not reacting when deleting a deep property that was undefined', expect => {
	const o = mutable({ deep: { value: undefined } })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.deep.value
	})
	execute()
	expect(calls).toBe(1)

	delete o.deep.value
	execute()
	expect(calls).toBe(1)
	expect('value' in o.deep).toBe(false)
	expect(calls).toBe(1)

	o.deep.value = undefined
	execute()
	expect(calls).toBe(1)

	o.deep.value = true
	execute()
	expect(calls).toBe(2)

	testValues(
		expect,
		v => {
			o.deep.value = v
		},
		() => o.deep.value,
	)
})

await test('supports not reacting when setting a primitive property to itself', expect => {
	const o = mutable({ value: 1 })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.value
	})
	execute()
	expect(calls).toBe(1)

	o.value = 1
	execute()
	expect(calls).toBe(1)

	testValues(
		expect,
		v => {
			o.value = v
		},
		() => o.value,
	)
})

await test('supports not reacting when setting a non-primitive property to itself', expect => {
	const o = mutable({ deep: { value: 2 } })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.deep.value
	})
	execute()
	expect(calls).toBe(1)

	o.deep = o.deep
	execute()
	expect(calls).toBe(1)

	testValues(
		expect,
		v => {
			o.deep.value = v
		},
		() => o.deep.value,
	)
})

await test('supports not reacting when setting a non-primitive property to itself, when reading all values - object ', expect => {
	const o = mutable({ value: {} })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.value
	})
	execute()
	expect(calls).toBe(1)

	o.value = o.value
	execute()
	expect(calls).toBe(1)

	testValues(
		expect,
		v => {
			o.value = v
		},
		() => o.value,
	)
})

await test('supports not reacting when reading the length on a non-array, when reading all values, if the length does not actually change', expect => {
	//TODO

	const o = mutable({ length: 0 })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.length
	})
	execute()
	expect(calls).toBe(1)

	o.length = o.length
	execute()
	expect(calls).toBe(1)
})

await test('supports reacting to own keys', expect => {
	const o = /** @type {Record<string, any>} */ (
		mutable({ foo: 1, bar: 2, baz: 3 })
	)

	let calls = 0

	const execute = memo(() => {
		calls += 1
		Object.keys(o)
	})
	execute()
	expect(calls).toBe(1)

	o.qux = 4
	execute()
	expect(calls).toBe(2)

	o.foo = 2 // already in
	o.bar = 3 // already in
	o.baz = 4 // already in
	o.qux = 5 // already in
	execute()
	expect(calls).toBe(2)

	o.qux = 5
	execute()
	expect(calls).toBe(2)

	o.qux = 6
	execute()
	expect(calls).toBe(2)

	o.qux2 = 7
	execute()
	expect(calls).toBe(3)

	delete o.foo
	execute()
	expect(calls).toBe(4)
	expect('foo' in o).toBe(false)
	expect(calls).toBe(4)

	o.foo = undefined
	execute()
	expect(calls).toBe(5)
	expect(o.foo).toBe(undefined)
	expect('foo' in o).toBe(true)

	o.foo = true
	execute()
	expect(calls).toBe(5)
	expect(o.foo).toBe(true)
	expect('foo' in o).toBe(true)
})

await test('supports reacting to own keys deep', expect => {
	const o = /** @type {{ value: Record<string, any> }} */ (
		mutable({ value: { foo: 1, bar: 2, baz: 3 } })
	)

	let calls = 0

	const execute = memo(() => {
		calls += 1
		Object.keys(o.value)
	})
	execute()
	expect(calls).toBe(1)

	o.value.qux = 4
	execute()
	expect(calls).toBe(2)

	o.value.foo = 2
	o.value.bar = 3
	o.value.baz = 4
	o.value.qux = 5
	execute()
	expect(calls).toBe(2)

	o.value.qux = 5
	execute()
	expect(calls).toBe(2)

	o.value.qux2 = 5
	execute()
	expect(calls).toBe(3)

	delete o.value.foo
	execute()
	expect(calls).toBe(4)
	expect('foo' in o.value).toBe(false)
	expect(calls).toBe(4)

	o.value.foo = undefined
	execute()
	expect(calls).toBe(5)
	expect(o.value.foo).toBe(undefined)
	expect('foo' in o.value).toBe(true)

	o.value.foo = true
	execute()
	expect(calls).toBe(5)
	expect(o.value.foo).toBe(true)
	expect('foo' in o.value).toBe(true)
})

await test('supports reacting to properties read by a getter', expect => {
	const o = mutable({
		foo: 1,
		bar: 2,
		get fn() {
			return this.foo + this.bar
		},
	})

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.fn
	})
	execute()
	expect(calls).toBe(1)

	o.foo = 10
	execute()
	expect(calls).toBe(2)
	expect(o.fn).toBe(12)

	o.bar = 20
	execute()
	expect(calls).toBe(3)
	expect(o.fn).toBe(30)
})

await test('supports reacting to properties read by a regular function', expect => {
	const o = mutable({
		foo: 1,
		bar: 2,
		fn() {
			return this.foo + this.bar
		},
	})

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.fn()
	})
	execute()
	expect(calls).toBe(1)

	o.foo = 10
	execute()
	expect(calls).toBe(2)
	expect(o.fn()).toBe(12)

	o.bar = 20
	execute()
	expect(calls).toBe(3)
	expect(o.fn()).toBe(30)
})

await test('supports reacting to properties read by a regular function, called via the call method', expect => {
	const o = mutable({
		foo: 1,
		bar: 2,
		fn() {
			return this.foo + this.bar
		},
	})

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.fn.call(o)
	})
	execute()
	expect(calls).toBe(1)

	o.foo = 10
	execute()
	expect(calls).toBe(2)
	expect(o.fn.call(o)).toBe(12)

	o.bar = 20
	execute()
	expect(calls).toBe(3)
	expect(o.fn.call(o)).toBe(30)
})

await test('supports reacting to properties read by a regular function, called via the apply method', expect => {
	const o = mutable({
		foo: 1,
		bar: 2,
		fn() {
			return this.foo + this.bar
		},
	})

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.fn.apply(o)
	})
	execute()
	expect(calls).toBe(1)

	o.foo = 10
	execute()
	expect(calls).toBe(2)
	expect(o.fn.apply(o)).toBe(12)

	o.bar = 20
	execute()
	expect(calls).toBe(3)
	expect(o.fn.apply(o)).toBe(30)
})

await test('supports batching implicitly - unsupported', expect => {
	batch(() => {
		const o = mutable({ foo: 1, bar: 2 })

		let calls = 0

		const execute = memo(() => {
			calls += 1
			o.foo
			o.bar
		})
		execute()
		expect(calls).toBe(1)

		o.foo = 10
		o.bar = 20
		execute()
		expect(calls).toBe(2)

		expect(o.foo).toBe(10)
		expect(o.bar).toBe(20)
	})
})

await test('supports batching setters automatically', expect => {
	const o = mutable({
		foo: 1,
		bar: 2,
		set fn(increment) {
			this.foo += increment
			this.bar += increment
		},
	})

	let calls = 0
	const execute = memo(() => {
		calls += 1
		o.foo
		o.bar
	})
	execute()
	expect(calls).toBe(1)

	o.fn = 1
	execute()
	expect(calls).toBe(2)

	expect(o.foo).toBe(2)
	expect(o.bar).toBe(3)
})

await test('supports batching deletions automatically Object.keys', expect => {
	const o = mutable({ foo: 1, bar: 2 })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.foo
		if ('foo' in o) {
		}
		Object.keys(o)
	})
	execute()
	expect(calls).toBe(1)

	delete o.foo
	execute()
	expect(calls).toBe(2)
	expect('foo' in o).toBe(false)
	expect(calls).toBe(2)

	expect('foo' in o).toBe(false)
	expect(calls).toBe(2)
})

await test('supports batching deletions automatically no Object.keys', expect => {
	const o = mutable({ foo: 1, bar: 2 })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.foo
		if ('foo' in o) {
		}
	})
	execute()
	expect(calls).toBe(1)

	delete o.foo
	execute()
	expect(calls).toBe(2)
	expect('foo' in o).toBe(false)
	expect(calls).toBe(2)

	expect('foo' in o).toBe(false)
	expect(calls).toBe(2)
})

await test('supports batching additions automatically Object.keys', expect => {
	const o = mutable({ bar: 2 })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.foo
		if ('foo' in o) {
		}
		Object.keys(o)
	})
	execute()
	expect(calls).toBe(1)

	o.foo = 1
	execute()
	expect(calls).toBe(2)
})

await test('supports batching additions automatically no Object.keys', expect => {
	const o = mutable({ bar: 2 })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.foo
		if ('foo' in o) {
		}
	})
	execute()
	expect(calls).toBe(1)

	o.foo = 1
	execute()
	expect(calls).toBe(2)
})

await test('supports batching additions automatically no Object.keys, no reading', expect => {
	const o = mutable({ bar: 2 })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		if ('foo' in o) {
		}
	})
	execute()
	expect(calls).toBe(1)

	o.foo = 1
	execute()
	expect(calls).toBe(2)
})

await test('supports batching additions automatically new property ', expect => {
	const o = mutable({ bar: 2 })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.foo
	})
	execute()
	expect(calls).toBe(1)

	o.foo = 1
	execute()
	expect(calls).toBe(2)
})

await test('supports reacting to changes on custom classes', expect => {
	class Foo {
		constructor() {
			this.foo = 0
			return mutable(this)
		}
	}

	class Bar extends Foo {
		constructor() {
			super()
			this.bar = 0
			return mutable(this)
		}
	}

	const foo = new Foo()
	const bar = new Bar()

	let calls = ''

	const execute1 = memo(() => {
		foo.foo
		calls += 'f'
	})
	execute1()

	const execute2 = memo(() => {
		bar.bar
		calls += 'b'
	})
	execute1(), execute2()

	expect(calls).toBe('fb')

	foo.foo += 1
	execute1(), execute2()
	expect(calls).toBe('fbf')

	bar.bar += 1
	execute1(), execute2()
	expect(calls).toBe('fbfb')
})

await test('supports reacting to property checks when value is undefined, deleting', expect => {
	const o = mutable({ value: undefined })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		if ('value' in o) {
		}
	})
	execute()
	expect(calls).toBe(1)

	delete o.value
	execute()
	expect(calls).toBe(2)
	expect('value' in o).toBe(false)
	expect(calls).toBe(2)

	delete o.value
	execute()
	expect(calls).toBe(2)
	expect('value' in o).toBe(false)
	expect(calls).toBe(2)
})

await test('supports reacting to property checks when value is undefined, deleting deep', expect => {
	const o = mutable({ value: { deep: undefined } })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		if ('deep' in o.value) {
		}
	})
	execute()
	expect(calls).toBe(1)

	delete o.value.deep
	execute()
	expect(calls).toBe(2)
	expect('deep' in o.value).toBe(false)
	expect(calls).toBe(2)

	delete o.value.deep
	execute()
	expect(calls).toBe(2)
	expect('deep' in o.value).toBe(false)
	expect(calls).toBe(2)
})

await test('supports reacting to property checks, adding', expect => {
	const o = mutable({})

	let calls = 0

	const execute = memo(() => {
		calls += 1
		if ('value' in o) {
		}
	})
	execute()
	expect(calls).toBe(1)

	o.value = undefined
	execute()
	expect(calls).toBe(2)

	o.value = undefined
	execute()
	expect(calls).toBe(2)
})

await test('supports reacting to property checks, adding deep', expect => {
	const o = mutable({ value: Object.create(null) })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		if ('deep' in o.value) {
		}
	})
	execute()
	expect(calls).toBe(1)

	o.value.deep = undefined
	execute()
	expect(calls).toBe(2)

	o.value.deep = undefined
	execute()
	expect(calls).toBe(2)
})

await test('survives reading a value inside a discarded root', expect => {
	const o = mutable({ value: 123 })

	let calls = 0

	root(dispose => {
		o.value

		root(() => {
			o.value
		})

		dispose()
	})

	const execute = memo(() => {
		calls += 1

		o.value
	})
	execute()
	expect(calls).toBe(1)

	o.value = 321
	execute()
	expect(calls).toBe(2)
})

await test('does nothing for primitives', expect => {
	const o = mutable(/** @type {{ foo: any }} */ ({ foo: 123 }))
	expect(o.foo).toBe(123)

	o.foo = 321
	expect(o.foo).toBe(321)

	o.foo = undefined
	expect(o.foo).toBe(undefined)

	o.foo = null
	expect(o.foo).toBe(null)

	o.foo = 0
	expect(o.foo).toBe(0)

	o.foo = ''
	expect(o.foo).toBe('')

	o.foo = 'string'
	expect(o.foo).toBe('string')

	o.foo = [true]
	expect(o.foo).toEqual([true])

	o.foo = { 0: true }
	expect(o.foo).toEqual({ 0: true })

	o.foo = [true]
	expect(o.foo).toEqual([true])

	o.foo = true
	expect(o.foo).toBe(true)

	o.foo = false
	expect(o.foo).toBe(false)

	o.foo = Infinity
	expect(o.foo).toBe(Infinity)

	o.foo = Infinity
	expect(o.foo).toBe(Infinity)

	o.foo = NaN
	expect(Object.is(o.foo, NaN)).toBe(true)

	o.foo = 1
	expect(o.foo).toBe(1)
})

await test('can mutate object returned by getter', expect => {
	const result = mutable({
		get greeting() {
			return { greet: { deep: `hi, quack` } }
		},
		set greeting(val) {},
	})
	expect(result.greeting.greet.deep).toBe('hi, quack')

	result.greeting.greet.deep = undefined
	expect(result.greeting.greet.deep).toBe('hi, quack')

	const tmp1 = result.greeting
	expect(tmp1.greet.deep).toBe('hi, quack')

	testValues(
		expect,
		v => {
			tmp1.greet.deep = v
		},
		() => tmp1.greet.deep,
	)

	const tmp2 = result.greeting.greet
	expect(tmp2.deep).toBe('hi, quack')

	testValues(
		expect,
		v => {
			tmp2.deep = v
		},
		() => tmp2.deep,
	)
})

// vue

await test('object.keys', expect => {
	const original = { foo: 1 }
	const result = mutable(original)
	expect(result.foo).toBe(1)
	expect(result).not.toBe(original)

	expect('foo' in result).toBe(true)

	expect(Object.keys(result)).toEqual(['foo'])
})

await test('observed value should proxy mutations to original (Object)', expect => {
	const original = { foo: 1 }
	const observed = mutable(original)
	// set
	observed.bar = 1
	expect(observed.bar).toBe(1)
	expect(original.bar).toBe(1)

	// delete
	delete observed.foo
	expect('foo' in observed).toBe(false)
	expect('foo' in original).toBe(false)
})

await test('original value change should reflect in observed value (Object)', expect => {
	// same as before test but the value set is on original rather than observed
	const original = { foo: 1 }
	const observed = mutable(original)

	// set
	original.bar = 1
	expect(original.bar).toBe(1)
	expect(observed.bar).toBe(1)

	// delete
	delete original.foo
	expect('foo' in original).toBe(false)
	expect('foo' in observed).toBe(false)
})

await test('setting a property with an unobserved value should wrap with reactive', expect => {
	const observed = mutable({})
	const raw = {}
	observed.foo = raw
	expect(observed.foo).not.toBe(raw)

	let calls = 0
	const execute = memo(() => {
		calls++
		observed.foo
	})
	execute()
	expect(calls).toBe(1)

	observed.foo = false
	execute()
	expect(calls).toBe(2)
})

await test('observing already observed value should return same Proxy', expect => {
	const original = { foo: 1 }
	const observed = mutable(original)
	const observed2 = mutable(observed)
	expect(observed2).toBe(observed)
})

await test('observing the same value multiple times should return same Proxy', expect => {
	const original = { foo: 1 }
	const observed = mutable(original)
	const observed2 = mutable(original)
	expect(observed).toBe(observed2)
})

// #1246
await test('mutation on objects using reactive as prototype should trigger', expect => {
	const observed = mutable({ foo: 1 })
	const original = Object.create(observed)
	let dummy
	let calls = 0
	const execute = memo(() => {
		calls++
		dummy = original.foo
	})
	execute()
	expect(dummy).toBe(1)
	expect(calls).toBe(1)

	observed.foo = 2
	execute()
	expect(dummy).toBe(2)
	expect(calls).toBe(2)
	expect(observed.foo).toBe(2)
	expect(original.foo).toBe(2)

	original.foo = 3
	execute()
	expect(dummy).toBe(3)
	expect(calls).toBe(3)
	expect(observed.foo).toBe(3)
	expect(original.foo).toBe(3)

	original.foo = 4
	execute()
	expect(dummy).toBe(4)
	expect(calls).toBe(4)
	expect(observed.foo).toBe(4)
	expect(original.foo).toBe(4)
})

await test('should not observe non-extensible objects', expect => {
	/**
	 * @type {{
	 * 	foo: { a: number }
	 * 	bar: { a: number }
	 * 	baz: { a: number }
	 * }}
	 */
	let mutableObj
	/**
	 * @type {{
	 * 	foo: { a: number }
	 * 	bar: { a: number }
	 * 	baz: { a: number }
	 * }}
	 */
	let testObj

	function createObjects() {
		mutableObj = mutable({
			foo: Object.preventExtensions({ a: 1 }),
			bar: Object.freeze({ a: 1 }),
			baz: Object.seal({ a: 1 }),
		})

		testObj = {
			foo: Object.preventExtensions({ a: 1 }),
			bar: Object.freeze({ a: 1 }),
			baz: Object.seal({ a: 1 }),
		}
	}

	createObjects()

	expect(mutableObj.foo).toEqual({ a: 1 })
	expect(mutableObj.bar).toEqual({ a: 1 })
	expect(mutableObj.baz).toEqual({ a: 1 })

	expect(Object.isExtensible(mutableObj.foo.a)).toBe(false)
	expect(Object.isExtensible(mutableObj.bar.a)).toBe(false)
	expect(Object.isExtensible(mutableObj.baz.a)).toBe(false)
	expect(Object.isFrozen(mutableObj.bar.a)).toBe(true)
	expect(Object.isSealed(mutableObj.bar.a)).toBe(true)

	// if js engine fails, then mutable should fail too
	function testAgainstJSEngine(key) {
		// change value
		createObjects()
		try {
			testObj[key].a = 2
			try {
				mutableObj[key].a = 2
			} catch (e) {
				console.error("shouldn't have failed to mutate value of", key)
			}
			// check the value actually changed [engine]
			expect(testObj[key].a).toBe(2)
			// check the value actually changed
			expect(mutableObj[key].a).toBe(2)
		} catch (e) {
			let fail = false
			try {
				mutableObj[key].a = 2
				fail = true
			} catch (e) {}
			if (fail) {
				console.error("shouldn't have mutated value of", key)
			}
		}
		expect(mutableObj[key].a).toBe(testObj[key].a)
		expect('a' in mutableObj[key]).toBe('a' in testObj[key])

		// delete value
		createObjects()
		try {
			delete testObj[key].a
			try {
				delete mutableObj[key].a
			} catch (e) {
				console.error("shouldn't have deleted property of", key)
			}
			// check the value actually changed [engine]
			expect('a' in testObj[key]).toBe(false)
			// check the value actually changed
			expect('a' in mutableObj[key]).toBe(false)
		} catch (e) {
			let fail = false
			try {
				delete mutableObj[key].a
				fail = true
			} catch (e) {}
			if (fail) {
				console.error("shouldn't have deleted property of", key)
			}
		}
		expect(mutableObj[key].a).toBe(testObj[key].a)
		expect('a' in mutableObj[key]).toBe('a' in testObj[key])

		// defineProperty
		createObjects()
		try {
			Object.defineProperty(testObj[key], 'ohai', { value: 17 })
			try {
				Object.defineProperty(mutableObj[key], 'ohai', {
					value: 17,
				})
			} catch (e) {
				console.error("shouldn't have mutated", key)
			}
		} catch (e) {
			let fail = false
			try {
				Object.defineProperty(mutableObj[key], 'ohai', {
					value: 17,
				})
				fail = true
			} catch (e) {}
			if (fail) {
				console.error("shouldn't have mutated", key)
			}
		}
		expect(mutableObj[key].ohai).toBe(testObj[key].ohai)
		expect('ohai' in mutableObj[key]).toBe('ohai' in testObj[key])

		// setPrototypeOf
		createObjects()
		try {
			Object.setPrototypeOf(testObj[key], { x: 17 })
			try {
				Object.setPrototypeOf(mutableObj[key], { x: 17 })
			} catch (e) {
				console.error("shouldn't have changed prototype of", key)
			}
		} catch (e) {
			let fail = false
			try {
				Object.setPrototypeOf(mutableObj[key], { x: 17 })
				fail = true
			} catch (e) {}
			if (fail) {
				console.error("shouldn't have changed prototype of", key)
			}
		}

		// __proto__
		createObjects()
		try {
			testObj[key].__proto__ = { x: 17 }
			try {
				mutableObj[key].__proto__ = { x: 17 }
			} catch (e) {
				console.error("shouldn't have changed prototype of", key)
			}
		} catch (e) {
			let fail = false
			try {
				mutableObj[key].__proto__ = { x: 17 }
				fail = true
			} catch (e) {}
			if (fail) {
				console.error("shouldn't have changed prototype of", key)
			}
		}
	}

	testAgainstJSEngine('foo')
	testAgainstJSEngine('bar')
	testAgainstJSEngine('baz')
})

await test('mutable identity', expect => {
	const raw = {}
	const obj1 = mutable(raw)
	const obj2 = mutable(raw)
	const obj3 = mutable(obj1)
	const obj4 = mutable(obj2)

	expect(obj1 === obj2 && obj2 === obj3 && obj3 === obj4).toBe(true)
})

await test('mutable identity nested', expect => {
	const raw = {}
	const obj1 = mutable({ value: raw })
	const obj2 = mutable({ value: raw })
	const obj3 = mutable({ value: obj1 })
	const obj4 = mutable({ value: obj2 })

	expect(obj1.value === obj2.value).toBe(true)
	expect(obj2.value === obj3.value.value).toBe(true)
	expect(obj3.value === obj1).toBe(true)
	expect(obj3.value.value === obj4.value.value).toBe(true)
})

await test('should observe basic properties', expect => {
	let dummy
	const counter = mutable({ num: 0 })

	let calls = 0
	const execute = memo(() => {
		calls += 1
		dummy = counter.num
	})
	execute()
	expect(calls).toBe(1)
	expect(dummy).toBe(0)

	counter.num = 7
	execute()
	expect(dummy).toBe(7)
	expect(calls).toBe(2)
})

await test('should observe multiple properties', expect => {
	batch(() => {
		let dummy
		const counter = mutable({ num1: 0, num2: 0 })
		let calls = 0
		const execute = memo(() => {
			calls += 1
			dummy = counter.num1 + counter.num1 + counter.num2
		})
		execute()
		expect(calls).toBe(1)
		expect(dummy).toBe(0)

		counter.num1 = counter.num2 = 7
		execute()
		expect(dummy).toBe(21)
		// fabio implementation of memo is clever
		expect(calls).toBe(2)
	})
})

await test('should handle multiple effects', expect => {
	let dummy1, dummy2
	let calls1 = 0
	let calls2 = 0
	const counter = mutable({ num: 0 })
	const execute1 = memo(() => {
		calls1++
		dummy1 = counter.num
	})
	const execute2 = memo(() => {
		calls2++
		dummy2 = counter.num
	})
	execute1(), execute2()

	expect(dummy1).toBe(0)
	expect(dummy2).toBe(0)
	expect(calls1).toBe(1)
	expect(calls2).toBe(1)
	counter.num++
	execute1(), execute2()
	expect(dummy1).toBe(1)
	expect(dummy2).toBe(1)
	expect(calls1).toBe(2)
	expect(calls2).toBe(2)
})

await test('should observe nested properties', expect => {
	let dummy
	let calls = 0
	const counter = mutable({ nested: { num: 0 } })
	const execute = memo(() => {
		calls++
		dummy = counter.nested.num
	})
	execute()

	expect(dummy).toBe(0)
	expect(calls).toBe(1)

	counter.nested.num = 8
	execute()
	expect(dummy).toBe(8)
	expect(calls).toBe(2)
})

await test('should observe delete operations', expect => {
	let dummy
	let calls = 0
	const obj = mutable({ prop: 'value' })
	const execute = memo(() => {
		calls++
		dummy = obj.prop
	})
	execute()

	expect(dummy).toBe('value')
	expect(calls).toBe(1)

	delete obj.prop
	execute()
	expect(dummy).toBe(undefined)
	expect(calls).toBe(2)
})

await test('should observe has operations', expect => {
	let dummy
	let calls = 0
	const obj = mutable(
		/** @type {{ prop: any }} */ ({ prop: 'value' }),
	)
	const execute = memo(() => {
		calls++
		dummy = 'prop' in obj
	})
	execute()

	expect(dummy).toBe(true)
	expect(calls).toBe(1)

	delete obj.prop
	execute()
	expect(dummy).toBe(false)
	expect(calls).toBe(2)
	obj.prop = 12
	execute()
	expect(dummy).toBe(true)
	expect(calls).toBe(3)
})

await test('should observe properties on the prototype chain', expect => {
	let dummy
	let calls = 0
	const counter = mutable({ num: 0 })
	const parentCounter = mutable({ num: 2 })
	Object.setPrototypeOf(counter, parentCounter)
	const execute = memo(() => {
		calls++
		dummy = counter.num
	})
	execute()

	expect(dummy).toBe(0)
	expect(calls).toBe(1)

	delete counter.num
	execute()
	expect(dummy).toBe(2)
	expect(calls).toBe(2)

	parentCounter.num = 4
	execute()
	expect(dummy).toBe(4)
	expect(calls).toBe(3)

	counter.num = 3
	execute()
	expect(dummy).toBe(3)
	expect(calls).toBe(4)
})

await test('should observe has operations on the prototype chain', expect => {
	let dummy
	let calls = 0
	const counter = mutable({ num: 0 })
	const parentCounter = mutable({ num: 2 })
	Object.setPrototypeOf(counter, parentCounter)
	const execute = memo(() => {
		calls++
		dummy = 'num' in counter
	})
	execute()

	expect(dummy).toBe(true)
	expect(calls).toBe(1)

	delete counter.num
	execute()
	expect(dummy).toBe(true)
	expect(calls).toBe(2)

	delete parentCounter.num
	execute()
	expect(dummy).toBe(false)
	expect(calls).toBe(3)

	counter.num = 3
	execute()
	expect(dummy).toBe(true)
	expect(calls).toBe(4)
})

await test('prototype change', expect => {
	let dummy
	let parentDummy
	let hiddenValue
	let calls1 = 0
	let calls2 = 0
	const obj = mutable({})
	const parent = mutable({
		set prop(value) {
			hiddenValue = value
		},
		get prop() {
			return hiddenValue
		},
	})
	Object.setPrototypeOf(obj, parent)
	const execute1 = memo(() => {
		calls1++
		dummy = obj.prop
	})
	const execute2 = memo(() => {
		calls2++
		parentDummy = parent.prop
	})
	execute1(), execute2()

	expect(dummy).toBe(undefined)
	expect(parentDummy).toBe(undefined)
	expect(calls1).toBe(1)
	expect(calls2).toBe(1)

	obj.prop = 4
	execute1(), execute2()
	expect(obj.prop).toBe(4)
	expect(dummy).toBe(4)
	expect(calls1).toBe(2)

	parent.prop = 2
	execute1(), execute2()
	expect(obj.prop).toBe(2)
	expect(dummy).toBe(2)
	expect(parentDummy).toBe(2)
	expect(parent.prop).toBe(2)
})

await test('should observe function call chains', expect => {
	let dummy
	let calls = 0
	const counter = mutable({ num: 0 })
	const execute = memo(() => {
		calls++
		dummy = getNum()
	})
	execute()

	function getNum() {
		return counter.num
	}

	expect(dummy).toBe(0)
	expect(calls).toBe(1)

	counter.num = 2
	execute()
	expect(dummy).toBe(2)
	expect(calls).toBe(2)
})

await test('should observe iteration', expect => {
	let dummy
	let calls = 0
	const list = mutable({ value: 'Hello' })
	const execute = memo(() => {
		calls++
		dummy = list.value
	})
	execute()

	expect(dummy).toBe('Hello')
	expect(calls).toBe(1)

	list.value += ' World!'
	execute()
	expect(dummy).toBe('Hello World!')
	expect(calls).toBe(2)

	list.value = list.value.replace('Hello ', '')
	execute()
	expect(dummy).toBe('World!')
	expect(calls).toBe(3)
})

await test('should observe enumeration', expect => {
	const numbers = mutable({ num1: 3 })

	let sum = 0
	let calls = 0
	const execute = memo(() => {
		calls++
		sum = 0
		for (let key in numbers) {
			sum += numbers[key]
		}
	})
	execute()

	expect(sum).toBe(3)
	expect(calls).toBe(1)

	numbers.num2 = 4
	execute()
	expect(sum).toBe(7)
	expect(calls).toBe(2)

	delete numbers.num1
	execute()
	expect(sum).toBe(4)
	expect(calls).toBe(3)
})

await test('should observe symbol keyed properties', expect => {
	const key = Symbol('symbol keyed prop')

	let dummy
	let hasDummy

	const obj = mutable({ [key]: 'value' })

	let calls1 = 0
	const execute1 = memo(() => {
		calls1++
		dummy = obj[key]
	})
	execute1()

	let calls2 = 0
	const execute2 = memo(() => {
		calls2++
		hasDummy = key in obj
	})
	execute1(), execute2()

	expect(calls1).toBe(1)
	expect(calls2).toBe(1)

	expect(dummy).toBe('value')
	expect(hasDummy).toBe(true)

	expect(calls1).toBe(1)
	expect(calls2).toBe(1)

	obj[key] = 'newValue'
	execute1(), execute2()

	expect(calls1).toBe(2)
	expect(calls2).toBe(1)

	expect(dummy).toBe('newValue')
	expect(hasDummy).toBe(true)

	expect(calls1).toBe(2)
	expect(calls2).toBe(1)

	delete obj[key]
	execute1(), execute2()

	expect(calls1).toBe(3)
	expect(calls2).toBe(2)

	expect(dummy).toBe(undefined)
	expect(hasDummy).toBe(false)
})

await test('should observe function valued properties', expect => {
	const oldFunc = () => {}
	const newFunc = () => {}

	let dummy
	let calls = 0
	const obj = mutable({ func: oldFunc })
	const execute = memo(() => {
		calls++
		dummy = obj.func
	})
	execute()
	expect(typeof dummy).toBe('function')
	expect(calls).toBe(1)
	obj.func = newFunc
	execute()
	expect(typeof obj.func).toBe('function')
	expect(calls).toBe(2)
})

await test('should observe getters relying on this', expect => {
	const obj = mutable({
		a: 1,
		get b() {
			return this.a
		},
	})

	let dummy
	let calls = 0
	const execute = memo(() => {
		calls++
		dummy = obj.b
	})
	execute()
	expect(dummy).toBe(1)
	expect(calls).toBe(1)

	obj.a++
	execute()
	expect(dummy).toBe(2)
	expect(calls).toBe(2)
})

await test('should observe methods relying on this', expect => {
	const obj = mutable({
		a: 1,
		b() {
			return this.a
		},
	})

	let dummy
	let calls = 0
	const execute = memo(() => {
		calls++
		dummy = obj.b()
	})
	execute()
	expect(dummy).toBe(1)
	expect(calls).toBe(1)

	obj.a++
	execute()
	expect(dummy).toBe(2)
	expect(calls).toBe(2)
})

await test('should not observe set operations without a value change', expect => {
	let hasDummy, getDummy
	const obj = mutable({ prop: 'value' })

	let calls1 = 0
	let calls2 = 0
	const execute1 = memo(() => {
		calls1++
		getDummy = obj.prop
	})
	execute1()
	const execute2 = memo(() => {
		calls2++
		hasDummy = 'prop' in obj
	})
	execute2()
	expect(calls1).toBe(1)
	expect(calls2).toBe(1)

	expect(getDummy).toBe('value')
	expect(hasDummy).toBe(true)

	obj.prop = 'value'
	execute1(), execute2()

	expect(calls1).toBe(1)
	expect(calls2).toBe(1)
	expect(getDummy).toBe('value')
	expect(hasDummy).toBe(true)
})

await test('should cut the loop', expect => {
	const counter = mutable({ num: 0 })
	let calls = 0
	const execute = memo(() => {
		calls++
		if (counter.num < 10) {
			counter.num++
		}
	})
	execute()
	expect(counter.num).toBe(10)
	expect(calls).toBe(11)
})

await test('should not be triggered by mutating a property, which is used in an inactive branch', expect => {
	let dummy
	const obj = mutable({ prop: 'value', run: true })

	let calls = 0
	const execute = memo(() => {
		calls++
		dummy = obj.run ? obj.prop : 'other'
	})
	execute()

	expect(dummy).toBe('value')
	expect(calls).toBe(1)

	obj.run = false
	execute()
	expect(dummy).toBe('other')
	expect(calls).toBe(2)

	obj.prop = 'value2'
	execute()
	expect(dummy).toBe('other')
	expect(calls).toBe(2)
})

await test('should not run multiple times for a single mutation', expect => {
	let dummy
	const obj = mutable({})
	let calls = 0
	const execute = memo(() => {
		calls++
		for (const key in obj) {
			dummy = obj[key]
		}
		dummy = obj.prop
	})
	execute()
	expect(calls).toBe(1)

	obj.prop = 16
	execute()

	expect(dummy).toBe(16)
	expect(calls).toBe(2)
})

await test('should observe json methods', expect => {
	let dummy = {}
	let calls = 0
	const obj = mutable({})
	const execute = memo(() => {
		calls++
		dummy = JSON.parse(JSON.stringify(obj))
	})
	execute()
	expect(calls).toBe(1)

	obj.a = 1
	execute()
	expect(dummy.a).toBe(1)
	expect(calls).toBe(2)
})

await test('should observe class method invocations', expect => {
	class Model {
		count
		constructor() {
			this.count = 0
		}
		inc() {
			this.count++
		}
	}
	const model = mutable(new Model())
	let dummy
	let calls = 0
	const execute = memo(() => {
		calls++
		dummy = model.count
	})
	execute()
	expect(dummy).toBe(0)
	expect(calls).toBe(1)

	model.inc()
	execute()
	expect(dummy).toBe(1)
	expect(calls).toBe(2)
})

await test('should not be triggered when the value and the old value both are NaN', expect => {
	const obj = mutable({
		foo: NaN,
	})
	let calls = 0
	const execute = memo(() => {
		calls++
		obj.foo
	})
	execute()
	expect(calls).toBe(1)

	obj.foo = NaN
	execute()
	expect(calls).toBe(1)
})

await test('should not be triggered when set with the same proxy', expect => {
	const obj = mutable({ foo: 1 })
	const observed = mutable({ obj })

	let calls = 0
	const execute = memo(() => {
		calls++
		observed.obj
	})
	execute()
	expect(calls).toBe(1)

	observed.obj = obj
	execute()
	expect(calls).toBe(1)
})

await test('should return updated value', expect => {
	const value = mutable({})
	let calls = 0
	const cValue = memo(() => {
		calls++
		return value.foo
	})
	expect(cValue()).toBe(undefined)
	expect(calls).toBe(1)
	value.foo = 1
	expect(cValue()).toBe(1)
	expect(calls).toBe(2)
})

await test('should trigger effect', expect => {
	const value = mutable({})
	const cValue = memo(() => value.foo)
	let dummy
	let calls = 0
	const execute = memo(() => {
		calls++
		dummy = cValue()
	})
	execute()

	expect(dummy).toBe(undefined)
	expect(calls).toBe(1)

	value.foo = 1
	execute()
	expect(dummy).toBe(1)
	expect(calls).toBe(2)
})

await test('should work when chained', expect => {
	const value = mutable({ foo: 0 })
	let calls1 = 0
	let calls2 = 0
	const c1 = memo(() => {
		calls1++
		return value.foo
	})
	const c2 = memo(() => {
		calls2++
		return c1() + 1
	})
	expect(c2()).toBe(1)
	expect(c1()).toBe(0)
	expect(calls1).toBe(1)
	expect(calls2).toBe(1)
	value.foo++
	expect(c2()).toBe(2)
	expect(c1()).toBe(1)
	expect(calls1).toBe(2)
	expect(calls2).toBe(2)
})

await test('should trigger effect when chained', expect => {
	const value = mutable({ foo: 0 })

	let calls1 = 0
	let calls2 = 0

	const c1 = memo(() => {
		calls1++
		return value.foo
	})
	const c2 = memo(() => {
		calls2++
		return c1() + 1
	})

	let dummy
	const execute = memo(() => {
		dummy = c2()
	})
	execute()

	expect(dummy).toBe(1)
	expect(calls1).toBe(1)
	expect(calls2).toBe(1)

	value.foo++
	execute()
	expect(dummy).toBe(2)
	// should not result in duplicate calls
	expect(calls1).toBe(2)
	expect(calls2).toBe(2)
})

await test('should trigger effect when chained (mixed invocations)', expect => {
	const value = mutable({ foo: 0 })

	let calls1 = 0
	let calls2 = 0

	const c1 = memo(() => {
		calls1++
		return value.foo
	})
	const c2 = memo(() => {
		calls2++
		return c1() + 1
	})

	let dummy
	const execute = memo(() => {
		dummy = c1() + c2()
	})
	execute()
	expect(dummy).toBe(1)

	expect(calls1).toBe(1)
	expect(calls2).toBe(1)

	value.foo++
	execute()

	expect(dummy).toBe(3)
	// should not result in duplicate calls
	expect(calls1).toBe(2)
	expect(calls2).toBe(2)
})

await test('should avoid infinite loops with other effects', expect => {
	batch(() => {
		const nums = mutable({ num1: 0, num2: 1 })

		let calls1 = 0
		let calls2 = 0

		const execute1 = memo(() => {
			calls1++
			nums.num1 = nums.num2
		})
		execute1()
		expect(nums.num1).toBe(1)
		expect(nums.num2).toBe(1)

		const execute2 = memo(() => {
			calls2++
			nums.num2 = nums.num1
		})
		execute1(), execute2()

		expect(nums.num1).toBe(1)
		expect(nums.num2).toBe(1)
		expect(calls1).toBe(1)
		expect(calls2).toBe(1)

		nums.num2 = 4
		execute1(), execute2()

		expect(nums.num1).toBe(4)
		expect(nums.num2).toBe(4)
		expect(calls1).toBe(2)
		expect(calls2).toBe(2)

		nums.num1 = 10
		execute1(), execute2()

		expect(nums.num1).toBe(10)
		expect(nums.num2).toBe(10)
		// this is just implementation specific, but shouldnt run more than 3 times
		expect(calls1).toBe(2)
		expect(calls2).toBe(3)
	})
})

// #1246
await test('mutation on objects using mutable as prototype should trigger', expect => {
	const original = mutable({ foo: 1 })

	const user = Object.create(original)

	let dummy
	let calls = 0
	const execute = memo(() => {
		calls++
		dummy = user.foo
	})
	execute()
	expect(dummy).toBe(1)
	expect(calls).toBe(1)

	original.foo = 2
	execute()
	expect(dummy).toBe(2)
	expect(calls).toBe(2)

	user.foo = 3
	execute()
	expect(dummy).toBe(3)
	expect(calls).toBe(3)

	user.foo = 4
	execute()
	expect(dummy).toBe(4)
	expect(calls).toBe(4)
})
await test('array: value: array property', expect => {
	const source = [{ cat: 'quack' }]
	const obj = mutable(source)

	expect(source[0].cat).toBe('quack')
	expect(obj[0].cat).toBe('quack')
})

await test('array: functions', expect => {
	const list = mutable([0, 1, 2])
	let calls = 0
	const filtered = memo(() => {
		calls++
		return list.filter(i => i % 2)
	})
	expect(filtered()).toEqual([1])
	expect(calls).toBe(1)
})

await test('array: functions nested', expect => {
	const list = mutable({ data: [0, 1, 2] })
	let calls = 0
	const filtered = memo(() => {
		calls++
		return list.data.filter(i => i % 2)
	})
	expect(filtered()).toEqual([1])
	expect(calls).toBe(1)
})

await test('array: equality: different array', expect => {
	const source = []
	const result = mutable(source)
	expect(result).not.toBe(source)
	expect(isProxy(result)).toBe(true)
})

await test('array: equality: different array nested', expect => {
	const source = []
	const result = mutable({ source })
	expect(result.source).not.toBe(source)
})

await test('array: equality: isArray', expect => {
	const source = []
	const result = mutable(source)
	expect(Array.isArray(result)).toBe(true)
	expect(isProxy(result)).toBe(true)
})

await test('array: equality: isArray nested', expect => {
	const source = { data: [] }
	const result = mutable(source)
	expect(Array.isArray(result.data)).toBe(true)
	expect(isProxy(result.data)).toBe(true)
})

await test('array: mutation: array property', expect => {
	const source = [{ cat: 'quack' }]
	const result = mutable(source)

	expect(source[0].cat).toBe('quack')
	expect(result[0].cat).toBe('quack')

	result[0].cat = 'murci'
	expect(source[0].cat).toBe('murci')
	expect(result[0].cat).toBe('murci')
})

await test('array: mutation: array todos', expect => {
	/**
	 * @type {{
	 * 	id: number
	 * 	title: string
	 * 	done: boolean | number
	 * }[]}
	 */
	const todos = mutable([
		{ id: 1, title: 'quack', done: true },
		{ id: 2, title: 'murci', done: false },
	])

	expect(todos[1].done).toBe(false)
	todos[1].done = Infinity
	expect(todos[1].done).toBe(Infinity)

	expect(todos.length).toBe(2)
	todos.push({ id: 3, title: 'mishu', done: false })
	expect(todos.length).toBe(3)

	expect(todos[1].done).toBe(Infinity)
	expect(Array.isArray(todos)).toBe(true)
	expect(todos[0].title).toBe('quack')
	expect(todos[1].title).toBe('murci')
	expect(todos[2].title).toBe('mishu')
})

await test('array: mutation: array batch', expect => {
	const result = mutable([1, 2, 3])
	batch(() => {
		expect(result.length).toBe(3)
		const move = result.splice(1, 1)
		expect(result.length).toBe(2)
		result.splice(0, 0, ...move)
		expect(result.length).toBe(3)
		expect(result).toEqual([2, 1, 3])
		result.push(4)
		expect(result.length).toBe(4)
		expect(result).toEqual([2, 1, 3, 4])
	})
	expect(result.length).toBe(4)
	expect(result.pop()).toBe(4)
	expect(result.length).toBe(3)
	expect(result).toEqual([2, 1, 3])
})

await test('array: getters: array', expect => {
	const result = mutable([
		{
			cat: 'quack',
			get greeting() {
				return `hi, ${this.cat}`
			},
		},
	])
	expect(result[0].greeting).toBe('hi, quack')

	result[0].cat = 'mishu'
	expect(result[0].greeting).toBe('hi, mishu')
})

await test('array: getter/setters: class in array', expect => {
	class Cat {
		#name = 'quack'
		get name() {
			return this.#name
		}
		set name(value) {
			this.#name = value
		}
		get greeting() {
			return `hi, ${this.#name}`
		}
	}
	const result = mutable([new Cat()])
	expect(result[0].greeting).toBe('hi, quack')

	result[0].name = 'mishu'
	expect(result[0].greeting).toBe('hi, mishu')
})

await test('array: supports wrapping a deep array inside a plain object', expect => {
	const o = mutable({ value: [] })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.value[0]
	})
	execute()
	expect(calls).toBe(1)

	o.value[0] = 3
	execute()
	expect(calls).toBe(2)
	expect(o.value[0]).toBe(3)

	testValues(
		expect,
		v => {
			o.value[0] = v
		},
		() => o.value[0],
	)
})

await test('array: supports wrapping an array', expect => {
	const o = mutable([])

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o[0]
	})
	execute()
	expect(calls).toBe(1)

	o[0] = 3
	execute()
	expect(calls).toBe(2)
	expect(o[0]).toBe(3)

	testValues(
		expect,
		v => {
			o[0] = v
		},
		() => o[0],
	)
})

await test('array: supports wrapping a deep array inside an array', expect => {
	const o = mutable([[]])

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o[0][0]
	})
	execute()
	expect(calls).toBe(1)

	o[0][0] = 3
	execute()
	expect(calls).toBe(2)
	expect(o[0][0]).toBe(3)

	testValues(
		expect,
		v => {
			o[0][0] = v
		},
		() => o[0][0],
	)
})

await test('array: supports wrapping a deep plain object inside an array', expect => {
	const o = mutable([{}])

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o[0].lala
	})
	execute()
	expect(calls).toBe(1)

	o[0].lala = 3
	execute()
	expect(calls).toBe(2)
	expect(o[0].lala).toBe(3)

	testValues(
		expect,
		v => {
			o[0].lala = v
		},
		() => o[0].lala,
	)
})

await test('array: supports not reacting when reading the length on a array, when reading all values, if the length does not actually change', expect => {
	const o = mutable({ value: [0] })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.value.length
	})
	execute()
	expect(calls).toBe(1)
	expect(o.value.length).toBe(1)

	o.value.splice(0, 1, 1)
	execute()
	expect(calls).toBe(1)
})

await test('array: should make Array reactive', expect => {
	const original = [{ foo: 1 }]
	const observed = mutable(original)
	expect(observed).not.toBe(original)

	// get
	expect(observed[0].foo).toBe(1)

	let calls = 0
	const execute = memo(() => {
		calls++
		observed[0].foo
	})
	execute()
	expect(calls).toBe(1)

	expect(observed[0].foo).toBe(1)

	observed[0].foo = 2
	execute()
	expect(observed[0].foo).toBe(2)
	expect(calls).toBe(2)

	// has
	expect(0 in observed).toBe(true)
	// ownKeys
	expect(Object.keys(observed)).toEqual(['0'])
})

await test('array: slice test', expect => {
	;[
		['ant', 'bison', 'camel', 'duck', 'elephant'],
		mutable(['ant', 'bison', 'camel', 'duck', 'elephant']),
	].forEach(array => {
		expect(array.slice(2)).toEqual(['camel', 'duck', 'elephant'])
		expect(array.slice(2, 4)).toEqual(['camel', 'duck'])
		expect(array.slice(1, 5)).toEqual([
			'bison',
			'camel',
			'duck',
			'elephant',
		])
		expect(array.slice(-2)).toEqual(['duck', 'elephant'])
		expect(array.slice(2, -1)).toEqual(['camel', 'duck'])
		expect(array.slice()).toEqual([
			'ant',
			'bison',
			'camel',
			'duck',
			'elephant',
		])

		expect(array.slice(-400, 600)).toEqual([
			'ant',
			'bison',
			'camel',
			'duck',
			'elephant',
		])

		expect(array.slice(-400, -44)).toEqual([])
		expect(array.slice(-44, -400)).toEqual([])
		expect(array.slice(2, -400)).toEqual([])
		expect(array.slice(2, -3)).toEqual([])
	})
})

await test('array: sliced test', expect => {
	const original = [{ foo: 1 }]
	const result = mutable(original)
	const clone = result.slice()
	expect(clone[0]).toBe(result[0])
	expect(clone[0]).toBe(original[0])
	expect(clone).not.toBe(result)

	let calls = 0
	const execute = memo(() => {
		calls++
		clone[0].foo
	})
	execute()
	expect(calls).toBe(1)

	expect(clone[0].foo).toBe(1)

	clone[0].foo = 2
	execute()
	expect(clone[0].foo).toBe(2)
	expect(result[0].foo).toBe(2)
	expect(original[0].foo).toBe(2)
	expect(calls).toBe(2)
})

await test('array: mutable identity', expect => {
	const raw = []
	const obj1 = mutable(raw)
	const obj2 = mutable(raw)
	const obj3 = mutable(obj1)
	const obj4 = mutable(obj2)

	expect(obj1 === obj2 && obj2 === obj3 && obj3 === obj4).toBe(true)
})

await test('array: mutable identity nested', expect => {
	const raw = []
	const obj1 = mutable({ value: raw })
	const obj2 = mutable({ value: raw })
	const obj3 = mutable({ value: obj1 })
	const obj4 = mutable({ value: obj2 })

	expect(obj1.value === obj2.value).toBe(true)
	expect(obj2.value === obj3.value.value).toBe(true)
	expect(obj3.value === obj1).toBe(true)
	expect(obj3.value.value === obj4.value.value).toBe(true)
})

class Sub3 extends Array {
	lastPushed
	lastSearched

	push(item) {
		// console.log('pushing from SubArray', item)
		this.lastPushed = item
		return super.push(item)
	}

	indexOf(searchElement, fromIndex) {
		this.lastSearched = searchElement
		return super.indexOf(searchElement, fromIndex)
	}
}
class Sub2 extends Sub3 {}
class Sub1 extends Sub2 {}
class SubArray extends Sub1 {}

await test('array: calls correct mutation method on Array subclass', expect => {
	const subArray = new SubArray(4, 5, 6)
	const observed = mutable(subArray)

	subArray.push(7)
	expect(subArray.lastPushed).toBe(7)
	observed.push(9)
	expect(observed.lastPushed).toBe(9)
})

await test('array: calls correct identity-sensitive method on Array subclass', expect => {
	const subArray = new SubArray(4, 5, 6)
	const observed = mutable(subArray)

	let index

	index = subArray.indexOf(4)
	expect(index).toBe(0)
	expect(subArray.lastSearched).toBe(4)

	index = observed.indexOf(6)
	expect(index).toBe(2)
	expect(observed.lastSearched).toBe(6)

	expect(mutable(observed)).toBe(mutable(subArray))
	expect(observed).toBe(mutable(subArray))
	expect(mutable(observed).slice()).not.toBe(
		mutable(subArray).slice(),
	)
})

await test('array: should be triggered when set length with string', expect => {
	let ret1 = 'idle'
	let ret2 = 'idle'
	let calls1 = 0
	let calls2 = 0
	const arr1 = mutable(new Array(11).fill(0))
	const arr2 = mutable(new Array(11).fill(0))
	const execute1 = memo(() => {
		calls1++
		ret1 = arr1[10] === undefined ? 'arr[10] is set to empty' : 'idle'
	})
	execute1()
	const execute2 = memo(() => {
		calls2++
		ret2 = arr2[10] === undefined ? 'arr[10] is set to empty' : 'idle'
	})
	execute2()
	expect(calls1).toBe(1)
	expect(calls2).toBe(1)

	arr1.length = 2
	const anyArr2 = /** @type {any} */ (arr2)
	anyArr2.length = '2'
	execute1()
	execute2()

	expect(ret1).toBe(ret2)
	expect(calls1).toBe(2)
	expect(calls2).toBe(2)
})

await test('array: is both a getter and a setter, for shallow non-primitive properties', expect => {
	const obj1 = [{ foo: 123 }]
	const obj2 = []

	const o = mutable({ value: obj1 })
	expect(o.value).toEqual(obj1)

	o.value = obj2
	expect(o.value).toEqual(obj2)

	o.value = obj1
	expect(o.value).toEqual(obj1)

	testValues(
		expect,
		v => {
			o.value = v
		},
		() => o.value,
	)
})

await test('array: deeper: is both a getter and a setter, for shallow non-primitive properties', expect => {
	/** @type {any} */
	const obj1 = { foo: 123 }
	/** @type {any} */
	const obj2 = []

	const o = mutable({ value: { deeper: obj1 } })
	expect(o.value.deeper).toEqual(obj1)

	o.value.deeper = obj2
	expect(o.value.deeper).toEqual(obj2)

	o.value.deeper = obj1
	expect(o.value.deeper).toEqual(obj1)

	testValues(
		expect,
		v => {
			o.value.deeper = v
		},
		() => o.value.deeper,
	)
})

await test('array: is both a getter and a setter, for deep non-primitive properties', expect => {
	/** @type {any} */
	const obj1 = { foo: 123 }
	/** @type {any} */
	const obj2 = []

	const o = mutable({ deep: { value: obj1 } })
	expect(o.deep.value).toEqual(obj1)

	o.deep.value = obj2
	expect(o.deep.value).toEqual(obj2)

	o.deep.value = obj1
	expect(o.deep.value).toEqual(obj1)

	testValues(
		expect,
		v => {
			o.deep.value = v
		},
		() => o.deep.value,
	)
})

await test('array: is both a getter and a setter, for deep non-primitive properties (memo)', expect => {
	/** @type {any} */
	const obj1 = { foo: 123 }
	/** @type {any} */
	const obj2 = []

	const o = mutable({ deep: { value: obj1 } })
	expect(o.deep.value).toEqual(obj1)

	let calls = 0
	const execute = memo(() => {
		calls += 1
		o.deep.value
	})
	execute()
	expect(calls).toBe(1)

	o.deep.value = obj2
	execute()
	expect(o.deep.value).toEqual(obj2)
	expect(calls).toBe(2)

	o.deep.value = obj1
	execute()
	expect(o.deep.value).toEqual(obj1)
	expect(calls).toBe(3)

	testValues(
		expect,
		v => {
			o.deep.value = v
		},
		() => o.deep.value,
	)
})

await test('array: reading length and pusing doesnt loop', expect => {
	const result = mutable([])

	let read = 0
	const execute = memo(() => {
		read++
		if (read < 100) {
			result.length
			result.push(Date.now())
			result.length
		}
		return read
	})
	execute()
	expect(read).toBe(100)
})

await test('array: mutating array length', expect => {
	/** @type {(number | boolean)[]} */
	const result = mutable([69])

	let calls = 0
	const execute1 = memo(() => {
		calls++
		result[40]
	})
	execute1()

	let calls2 = 0
	const execute2 = memo(() => {
		calls2++
		result[2]
	})
	execute1(), execute2()

	let calls3 = 0
	const execute3 = memo(() => {
		calls3++
		result.length
	})
	execute1(), execute2(), execute3()

	expect(result.length).toBe(1)
	expect(result[40]).toBe(undefined)
	expect(result[2]).toBe(undefined)
	expect(result[0]).toBe(69)

	expect(calls).toBe(1)
	expect(calls2).toBe(1)
	expect(calls3).toBe(1)

	result.length = 45
	execute1(), execute2(), execute3()

	expect(result.length).toBe(45)
	expect(calls).toBe(1)
	expect(calls2).toBe(1)
	expect(calls3).toBe(2)

	result[40] = true
	execute1(), execute2(), execute3()

	expect(result[40]).toBe(true)
	expect(calls).toBe(2)
	expect(calls2).toBe(1)
	expect(calls3).toBe(2)

	result[41] = true
	execute1(), execute2(), execute3()

	expect(result[41]).toBe(true)
	expect(calls).toBe(2)
	expect(calls2).toBe(1)
	expect(calls3).toBe(2)

	result[2] = true
	execute1(), execute2(), execute3()

	expect(result[2]).toBe(true)
	expect(calls).toBe(2)
	expect(calls2).toBe(2)
	expect(calls3).toBe(2)

	result.push()
	execute1(), execute2(), execute3()

	expect(calls).toBe(2)
	expect(calls2).toBe(2)
	expect(calls3).toBe(2)

	result.unshift()
	execute1(), execute2(), execute3()

	expect(calls).toBe(2)
	expect(calls2).toBe(2)
	expect(calls3).toBe(2)

	result.push(1)
	execute1(), execute2(), execute3()

	expect(calls).toBe(2)
	expect(calls2).toBe(2)
	expect(calls3).toBe(3)
})

await test('array: pushing in two separated effects doesnt loop', expect => {
	const result = mutable([0])
	let calls1 = 0
	let calls2 = 0

	const execute1 = memo(() => {
		calls1++
		result.push(1)
	})
	execute1()

	const execute2 = memo(() => {
		calls2++
		result.push(2)
	})
	execute1(), execute2()

	expect(result).toEqual([0, 1, 2])
	expect(calls1).toBe(1)
	expect(calls2).toBe(1)
})

await test('array: track: array functions', expect => {
	const result = mutable([{ username: 'lala' }])

	let called = 0
	const execute = memo(() => {
		try {
			result[0].username
		} catch (e) {}
		called++
	})
	execute()

	expect(result[0].username).toBe('lala')
	expect(called).toBe(1)

	result[0].username = 'lala2'
	execute()
	expect(result[0].username).toBe('lala2')
	expect(called).toBe(2)

	// setting to same value
	result[0].username = 'lala2'
	execute()

	expect(result[0].username).toBe('lala2')
	expect(called).toBe(2)

	result.pop()
	execute()
	expect(called).toBe(3)
	expect(result.length).toBe(0)

	result.push({ username: 'lala2' })
	execute()
	expect(called).toBe(4)

	result.push({ username: 'lala3' })
	execute()
	expect(called).toBe(4)

	result.push({ username: 'lala4' })
	execute()
	expect(called).toBe(4)

	result[0].username = 'lala5'
	execute()
	expect(called).toBe(5)
})

await test('array: track: array functions read vs write', expect => {
	const result = mutable([1])

	let called = 0
	const execute = memo(() => {
		JSON.stringify(result)
		called++
	})
	execute()

	expect(result[0]).toBe(1)
	expect(called).toBe(1)

	result.filter(i => i % 2)
	execute()
	expect(called).toBe(1)

	result.filter(i => i % 2)
	execute()
	expect(called).toBe(1)

	result.push(2)
	execute()
	expect(called).toBe(2)
})

await test('array: track: array functions read', expect => {
	const result = mutable([1])

	let called = 0
	const execute = memo(() => {
		result.filter(i => i % 2)
		called++
	})
	execute()
	expect(result[0]).toBe(1)
	expect(called).toBe(1)

	result.push(2)
	execute()
	expect(called).toBe(2)

	result.push(3)
	execute()
	expect(called).toBe(3)

	result.push(4)
	execute()
	expect(called).toBe(4)
})

await test('array: supports not reacting when setting a non-primitive property to itself, when reading all values', expect => {
	const o = mutable([0])

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o[0]
	})
	execute()
	expect(calls).toBe(1)

	o[0] = o[0]
	execute()
	expect(calls).toBe(1)

	testValues(
		expect,
		v => {
			o[0] = v
		},
		() => o[0],
	)
})

await test('array: supports reacting when array length changes', expect => {
	const o = mutable({ value: [0] })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.value.length
	})
	execute()
	expect(calls).toBe(1)
	expect(o.value.length).toBe(1)

	o.value.pop()
	execute()
	expect(calls).toBe(2)
	expect(o.value.length).toBe(0)
})

await test('array: supports reacting when array length is set explicity', expect => {
	const o = mutable({ value: [0] })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.value.length
	})
	execute()
	expect(calls).toBe(1)
	expect(o.value.length).toBe(1)

	o.value.length = 0
	execute()
	expect(calls).toBe(2)
	expect(o.value.length).toBe(0)
})

await test('array: supports reacting when array length is set explicity while reading value', expect => {
	const o = mutable({ value: [0, 2] })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.value[0]
		o.value[1]
	})
	execute()
	expect(calls).toBe(1)
	expect(o.value.length).toBe(2)

	o.value.length = 0
	execute()
	expect(calls).toBe(2)
	expect(o.value.length).toBe(0)
	expect(o.value[0]).toBe(undefined)
})

await test('array: supports not reacting when array reading function is called ', expect => {
	const o = mutable({ value: [0, 1] })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.value
		o.value[0]
	})
	execute()
	expect(calls).toBe(1)
	expect(o.value.length).toBe(2)

	o.value.filter(() => {})
	execute()

	expect(calls).toBe(1)
	expect(o.value.length).toBe(2)
})

await test('array: supports not reacting when array writing function is called ', expect => {
	const o = mutable({ value: [0, 1] })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.value[0]
	})
	execute()
	expect(calls).toBe(1)
	expect(o.value.length).toBe(2)

	o.value.push(2)
	execute()

	expect(calls).toBe(1)
	expect(o.value.length).toBe(3)
})

await test('array: supports reacting to changes in deep arrays', expect => {
	const o = mutable({ value: [1, 2] })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.value.length
	})
	execute()
	expect(calls).toBe(1)

	o.value.pop()
	execute()
	expect(calls).toBe(2)

	o.value.pop()
	execute()
	expect(calls).toBe(3)

	o.value.push(1)
	execute()
	expect(calls).toBe(4)
})

await test('array: supports not reacting to no-changes in deep arrays', expect => {
	const o = mutable({ value: [1, 2] })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.value.length
	})
	execute()
	expect(calls).toBe(1)

	o.value.filter(() => {})
	execute()
	expect(calls).toBe(1)

	o.value.filter(() => {})
	execute()
	expect(calls).toBe(1)

	o.value.push(1)
	execute()
	expect(calls).toBe(2)
})

await test('array: supports reacting to changes in top-level arrays', expect => {
	/** @type {(number | boolean)[]} */
	const o = mutable([1, 2])

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.length
	})
	execute()
	expect(calls).toBe(1)

	o.pop()
	execute()
	expect(calls).toBe(2)

	o.pop()
	execute()
	expect(calls).toBe(3)

	o.push(1)
	execute()
	expect(calls).toBe(4)

	o[0] = true
	execute()
	expect(calls).toBe(4)
})

await test('array: supports not reacting to changes in top-level arrays', expect => {
	/** @type {(number | boolean)[]} */
	const o = mutable([1, 2])

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.length
	})
	execute()
	expect(calls).toBe(1)

	o.filter(() => {})
	execute()
	expect(calls).toBe(1)

	o.filter(() => {})
	execute()
	expect(calls).toBe(1)

	o.push(3)
	execute()
	expect(calls).toBe(2)

	o.push(4)
	execute()
	expect(calls).toBe(3)

	o[0] = false
	execute()
	expect(calls).toBe(3)
})

await test('array: supports reacting to changes at a specific index in deep arrays', expect => {
	const o = mutable({ value: [1, 2] })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.value[0]
	})
	execute()
	expect(calls).toBe(1)

	o.value.pop()
	execute()
	expect(calls).toBe(1)

	o.value.push(10)
	execute()
	expect(calls).toBe(1)

	o.value[0] = 123
	execute()
	expect(calls).toBe(2)

	o.value.unshift(1)
	execute()
	expect(calls).toBe(3)

	o.value.unshift(1)
	execute()
	expect(calls).toBe(3)

	o.value.unshift(2)
	execute()
	expect(calls).toBe(4)
})

await test('array: supports reacting to changes at a specific index in top-level arrays', expect => {
	const o = mutable([1, 2])

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o[0]
	})
	execute()
	expect(calls).toBe(1)

	o.pop()
	execute()
	expect(calls).toBe(1)

	o.push(10)
	execute()
	expect(calls).toBe(1)

	o[0] = 123
	execute()
	expect(calls).toBe(2)

	o.unshift(1)
	execute()
	expect(calls).toBe(3)

	o.unshift(1)
	execute()
	expect(calls).toBe(3)

	o.unshift(2)
	execute()
	expect(calls).toBe(4)
})

await test('array: supports batching array methods automatically', expect => {
	const o = mutable({ value: [1, 2, 3] })

	let calls = 0

	const execute = memo(() => {
		calls += 1
		o.value.forEach(() => {})
	})
	execute()
	expect(calls).toBe(1)

	o.value.forEach((value, index) => {
		// console.log(o.value)
		o.value[index] = value * 2
	})
	execute()
	expect(calls).toBe(2)
})

await test('array: treats number and string properties the same way', expect => {
	const o = mutable([0])

	let callsNumber = 0
	let callsString = 0

	const execute1 = memo(() => {
		callsNumber += 1
		o[0]
	})
	execute1()
	const execute2 = memo(() => {
		callsString += 1
		o['0']
	})
	execute1(), execute2()

	expect(callsNumber).toBe(1)
	expect(callsString).toBe(1)

	o[0] = 1
	execute1(), execute2()
	expect(callsNumber).toBe(2)
	expect(callsString).toBe(2)

	o['0'] = 2
	execute1(), execute2()
	expect(callsNumber).toBe(3)
	expect(callsString).toBe(3)
})

await test('array: observed value should proxy mutations to original', expect => {
	/** @type {any[]} */
	const original = [{ foo: 1 }, { bar: 2 }]
	const observed = mutable(original)

	// set
	/** @type {any} */
	const value = { baz: 3 }
	const result = mutable(value)
	observed[0] = value
	expect(observed[0]).toBe(result)
	expect(isProxy(observed[0])).toBe(true)
	expect(original[0]).not.toBe(value)

	// delete
	delete observed[0]
	expect(observed[0]).toBe(undefined)
	expect(original[0]).toBe(undefined)

	// mutating methods
	observed.push(value)
	expect(observed[2]).toBe(result)
	expect(original[2]).toBe(result)
})

await test('array: identity methods should work', expect => {
	let og = {}
	let arr

	function test(value) {
		expect(arr.indexOf(value || og)).toBe(2)
		expect(arr.indexOf(value || og, 3)).toBe(-1)
		expect(arr.includes(value || og)).toBe(true)
		expect(arr.includes(value || og, 3)).toBe(false)
		expect(arr.lastIndexOf(value || og)).toBe(2)
		expect(arr.lastIndexOf(value || og, 1)).toBe(-1)
		expect(arr.lastIndexOf(0)).toBe(6)
	}

	// sanity check, plain objects
	arr = [{}, {}, og, {}, {}, {}, 0]
	test()

	// mutable
	arr = mutable([{}, {}, og, {}, {}, {}, 0])
	test()

	// should work with the proxy
	test(arr[2])

	// one is the proxy, the other is the original object
	expect(arr[2]).not.toBe(og)
})

await test('array: identity methods should be reactive', expect => {
	const obj = {}
	const arr = mutable([obj, {}])

	const search = arr[0]

	let index = -1
	let calls = 0
	const execute = memo(() => {
		calls++
		index = arr.indexOf(search)
	})
	execute()
	expect(index).toBe(0)
	expect(calls).toBe(1)

	arr.reverse()
	execute()
	expect(index).toBe(1)
	expect(calls).toBe(2)
})

await test('array: internal array functions should search for the mutable versions of it', expect => {
	const item1 = { id: 1 }
	const item2 = { id: 2 }

	const state = mutable({ items: [] })

	state.items = [...state.items, item1]

	expect(state.items.indexOf(item1)).toBe(0)

	state.items = [...state.items, item2]

	expect(state.items.indexOf(item2)).toBe(1)
})

await test('array: delete on Array should not trigger length dependency', expect => {
	const arr = mutable([1, 2, 3])

	let calls = 0
	const execute = memo(() => {
		calls++
		arr.length
	})
	execute()
	expect(calls).toBe(1)

	delete arr[1]
	execute()
	expect(calls).toBe(1)
})

await test('array: shift on Array should trigger dependency once', expect => {
	const arr = mutable([1, 2, 3])

	let calls = 0
	const execute = memo(() => {
		calls++
		for (let i = 0; i < arr.length; i++) {
			arr[i]
		}
	})
	execute()
	expect(calls).toBe(1)

	arr.shift()
	execute()
	expect(calls).toBe(2)
})

//#6018
await test('array: edge case: avoid trigger effect in deleteProperty when array length-decrease mutation methods called', expect => {
	const arr = mutable([1])

	let calls = 0
	const execute = memo(() => {
		calls++
		if (arr.length > 0) {
			arr.slice()
		}
	})
	execute()
	expect(calls).toBe(1)

	arr.splice(0)
	execute()
	expect(calls).toBe(2)
})

await test('array: add existing index on Array should not trigger length dependency', expect => {
	const array = new Array(3)
	const observed = mutable(array)
	let calls = 0
	const execute = memo(() => {
		calls++
		observed.length
	})
	execute()
	expect(calls).toBe(1)

	observed[1] = 1
	execute()
	expect(calls).toBe(1)
})

await test('array: add non-integer prop on Array should not trigger length dependency', expect => {
	const array = new Array(3)
	const observed = mutable(array)
	let calls = 0
	const execute = memo(() => {
		calls++
		observed.length
	})
	execute()
	expect(calls).toBe(1)

	observed.x = 'x'
	execute()
	expect(calls).toBe(1)

	observed[-1] = 'x'
	execute()
	expect(calls).toBe(1)

	observed[NaN] = 'x'
	execute()
	expect(calls).toBe(1)
})

// #2427
await test('array: track length on for ... in iteration', expect => {
	const array = mutable([1])
	let length = ''
	let calls = 0
	const execute = memo(() => {
		calls++
		length = ''
		for (const key in array) {
			length += key
		}
	})
	execute()
	expect(length).toBe('0')
	expect(calls).toBe(1)

	array.push(1)
	execute()
	expect(length).toBe('01')
	expect(calls).toBe(2)
})

// #9742
await test('array: mutation on user proxy of reactive Array', expect => {
	const array = mutable([])
	const proxy = new Proxy(array, {})
	proxy.push(1)
	expect(array.length).toBe(1)
	expect(proxy.length).toBe(1)
})

await test('array: should observe iteration', expect => {
	let dummy
	let calls = 0
	const list = mutable(['Hello'])
	const execute = memo(() => {
		calls++
		dummy = list.join(' ')
	})
	execute()

	expect(dummy).toBe('Hello')
	expect(calls).toBe(1)

	list.push('World!')
	execute()
	expect(dummy).toBe('Hello World!')
	expect(calls).toBe(2)

	list.shift()
	execute()
	expect(dummy).toBe('World!')
	expect(calls).toBe(3)
})

await test('array: should observe implicit array length changes', expect => {
	let dummy
	let calls = 0
	const list = mutable(['Hello'])
	const execute = memo(() => {
		calls++
		dummy = list.join(' ')
	})
	execute()

	expect(dummy).toBe('Hello')
	expect(calls).toBe(1)

	list[1] = 'World!'
	execute()
	expect(dummy).toBe('Hello World!')
	expect(calls).toBe(2)

	list[3] = 'Hello!'
	execute()
	expect(dummy).toBe('Hello World!  Hello!')
	expect(calls).toBe(3)
})

await test('array: should observe sparse array mutations', expect => {
	let dummy
	let calls = 0
	const list = mutable([])
	list[1] = 'World!'
	const execute = memo(() => {
		calls++
		dummy = list.join(' ')
	})
	execute()
	expect(dummy).toBe(' World!')
	expect(calls).toBe(1)

	list[0] = 'Hello'
	execute()
	expect(dummy).toBe('Hello World!')
	expect(calls).toBe(2)

	list.pop()
	execute()
	expect(dummy).toBe('Hello')
	expect(calls).toBe(3)
})

await test('array: should not observe well-known symbol keyed properties', expect => {
	/** @type {symbol} */
	const key = Symbol.isConcatSpreadable
	let dummy
	const array = /** @type {any[] & Record<symbol, any>} */ (
		mutable([])
	)
	let calls = 0
	const execute = memo(() => {
		calls++
		dummy = array[key]
	})
	execute()
	expect(calls).toBe(1)

	expect(array[key]).toBe(undefined)
	expect(dummy).toBe(undefined)

	array[key] = true
	execute()
	expect(array[key]).toBe(true)
	expect(dummy).toBe(undefined)
	expect(calls).toBe(1)
})

await test('array: should support manipulating an array while observing symbol keyed properties', expect => {
	/** @type {symbol} */
	const key = Symbol()
	let dummy
	let calls = 0
	const array = /** @type {any[] & Record<symbol, any>} */ (
		mutable([1, 2, 3])
	)
	const execute = memo(() => {
		calls++
		dummy = array[key]
	})
	execute()
	expect(calls).toBe(1)
	expect(dummy).toBe(undefined)

	array.pop()
	execute()
	expect(calls).toBe(1)

	array.shift()
	execute()
	expect(calls).toBe(1)

	array.splice(0, 1)
	execute()
	expect(calls).toBe(1)
	expect(dummy).toBe(undefined)

	array[key] = 'value'
	execute()
	expect(calls).toBe(2)
	expect(dummy).toBe('value')

	array.length = 0
	execute()
	expect(calls).toBe(2)
	expect(dummy).toBe('value')
})

await test('array: should trigger all effects when array length is set to 0', expect => {
	const observed = mutable([1])

	let length
	let calls1 = 0
	const execute1 = memo(() => {
		calls1++
		length = observed.length
	})
	execute1()

	let a
	let calls2 = 0
	const execute2 = memo(() => {
		calls2++
		a = observed[0]
	})
	execute2()

	expect(length).toBe(1)
	expect(a).toBe(1)
	expect(calls1).toBe(1)
	expect(calls2).toBe(1)

	observed[1] = 2
	execute1(), execute2()

	expect(observed[1]).toBe(2)
	expect(observed.length).toBe(2)
	expect(length).toBe(2)
	expect(calls1).toBe(2)

	observed.unshift(3)
	execute1(), execute2()
	expect(length).toBe(3)
	expect(a).toBe(3)

	observed.length = 0
	execute1(), execute2()
	expect(length).toBe(0)
	expect(a).toBe(undefined)
})

await test('array: identity methods should work if raw value contains reactive objects', expect => {
	const nativearr = []
	const obj = mutable({})
	nativearr.push(obj)

	const reactivearr = mutable(nativearr)
	// console.log(reactivearr, nativearr, obj)
	expect(reactivearr.includes(obj)).toBe(true)
})

await test('array: iterator references', expect => {
	const item = { a: 1 }

	const obj = mutable([item, item])

	let count = 0
	let calls = 0
	const execute = memo(() => {
		calls++
		for (const key in obj) {
			count += obj.includes(obj[key]) ? 1 : 0
		}
		expect(count).toBe(2)

		for (const key in obj) {
			count += obj.indexOf(obj[key]) !== -1 ? 1 : 0
		}
		expect(count).toBe(4)

		for (const item of obj) {
			count += obj.includes(item) ? 1 : 0
		}
		expect(count).toBe(6)

		for (const item of obj) {
			count += obj.indexOf(item) !== -1 ? 1 : 0
		}
		expect(count).toBe(8)

		for (const item of obj.values()) {
			count += obj.includes(item) ? 1 : 0
		}
		expect(count).toBe(10)

		for (const item of obj.values()) {
			count += obj.indexOf(item) !== -1 ? 1 : 0
		}
		expect(count).toBe(12)

		for (const [k, item] of obj.entries()) {
			count += obj.includes(item) ? 1 : 0
		}
		expect(count).toBe(14)

		for (const [k, item] of obj.entries()) {
			count += obj.indexOf(item) !== -1 ? 1 : 0
		}
		expect(count).toBe(16)
	})
	execute()

	expect(calls).toBe(1)

	expect(count).toBe(16)

	expect(calls).toBe(1)
})

await test('array: should avoid infinite recursive loops when use Array.prototype.push/unshift/pop/shift', expect => {
	;['push', 'unshift'].forEach(key => {
		const arr = mutable([])
		let calls1 = 0
		let calls2 = 0
		const execute1 = memo(() => {
			calls1++
			arr[key](1)
		})
		execute1()
		const execute2 = memo(() => {
			calls2++
			arr[key](2)
		})
		execute2()
		expect(arr.length).toBe(2)
		expect(calls1).toBe(1)
		expect(calls2).toBe(1)
	})
	;['pop', 'shift'].forEach(key => {
		const arr = mutable([1, 2, 3, 4])
		let calls1 = 0
		let calls2 = 0
		const execute1 = memo(() => {
			calls1++
			arr[key]()
		})
		execute1()
		const execute2 = memo(() => {
			calls2++
			arr[key]()
		})
		execute2()
		expect(arr.length).toBe(2)
		expect(calls1).toBe(1)
		expect(calls2).toBe(1)
	})
})

/* vue array instrumentation https://github.com/vuejs/core/pull/9511/files */

await test('array: vue array instrumentation: iterator', expect => {
	const shallow = mutable([1, 2, 3, 4])
	let calls = 0
	let result = memo(() => {
		calls++
		let sum = 0
		for (let x of shallow) {
			sum += x ** 2
		}
		return sum
	})
	expect(result()).toBe(30)
	expect(calls).toBe(1)

	shallow[2] = 0
	expect(result()).toBe(21)
	expect(calls).toBe(2)

	const deep = mutable([{ val: 1 }, { val: 2 }])
	let calls2 = 0
	result = memo(() => {
		calls2++
		let sum = 0
		for (let x of deep) {
			sum += x.val ** 2
		}
		return sum
	})
	expect(result()).toBe(5)
	expect(calls2).toBe(1)

	deep[1].val = 3
	expect(result()).toBe(10)
	expect(calls2).toBe(2)
})

await test('array: vue array instrumentation: concat', expect => {
	batch(() => {
		const a1 = mutable([1, { val: 2 }])
		const a2 = mutable([{ val: 3 }])
		const a3 = [4, 5]

		let calls = 0
		let result = memo(() => {
			calls++
			return a1.concat(a2, a3)
		})
		expect(result()).toEqual([1, { val: 2 }, { val: 3 }, 4, 5])
		expect(isProxy(result()[1])).toBe(true)
		expect(isProxy(result()[2])).toBe(true)
		expect(calls).toBe(1)

		a1.shift()
		expect(result()).toEqual([{ val: 2 }, { val: 3 }, 4, 5])
		expect(calls).toBe(2)

		a2.pop()
		expect(result()).toEqual([{ val: 2 }, 4, 5])
		expect(calls).toBe(3)

		// a3 is not reactive, so this wont trigger a memo refresh
		a3.pop()
		expect(result()).toEqual([{ val: 2 }, 4, 5])
		expect(calls).toBe(3)
	})
})

await test('array: vue array instrumentation: entries', expect => {
	const shallow = mutable([0, 1])
	let calls1 = 0
	const result1 = memo(() => {
		calls1++
		return Array.from(shallow.entries())
	})
	expect(result1()).toEqual([
		[0, 0],
		[1, 1],
	])
	expect(calls1).toBe(1)

	shallow[1] = 10
	expect(result1()).toEqual([
		[0, 0],
		[1, 10],
	])
	expect(calls1).toBe(2)

	const deep = mutable([{ val: 0 }, { val: 1 }])
	let calls2 = 0
	const result2 = memo(() => {
		calls2++
		return Array.from(deep.entries())
	})
	expect(result2()).toEqual([
		[0, { val: 0 }],
		[1, { val: 1 }],
	])
	expect(isProxy(result2()[0][1])).toBe(true)
	expect(calls2).toBe(1)

	deep.pop()
	expect(Array.from(result2())).toEqual([[0, { val: 0 }]])
	expect(calls2).toBe(2)
})

await test('array: vue array instrumentation: every', expect => {
	const shallow = mutable([1, 2, 5])
	let calls1 = 0
	let result = memo(() => {
		calls1++
		return shallow.every(x => x < 5)
	})
	expect(result()).toBe(false)
	expect(calls1).toBe(1)

	shallow.pop()
	expect(result()).toBe(true)
	expect(calls1).toBe(2)

	const deep = mutable([{ val: 1 }, { val: 5 }])
	let calls2 = 0
	result = memo(() => {
		calls2++
		return deep.every(x => x.val < 5)
	})
	expect(result()).toBe(false)
	expect(calls2).toBe(1)

	deep[1].val = 2
	expect(result()).toBe(true)
	expect(calls2).toBe(2)
})

await test('array: vue array instrumentation: filter', expect => {
	const shallow = mutable([1, 2, 3, 4])
	let calls1 = 0
	const result1 = memo(() => {
		calls1++
		return shallow.filter(x => x < 3)
	})
	expect(result1()).toEqual([1, 2])
	expect(calls1).toBe(1)

	shallow[2] = 0
	expect(result1()).toEqual([1, 2, 0])
	expect(calls1).toBe(2)

	const deep = mutable([{ val: 1 }, { val: 2 }])
	let calls2 = 0
	const result2 = memo(() => {
		calls2++
		return deep.filter(x => x.val < 2)
	})
	expect(result2()).toEqual([{ val: 1 }])
	expect(isProxy(result2()[0])).toBe(true)
	expect(calls2).toBe(1)

	deep[1].val = 0
	expect(result2()).toEqual([{ val: 1 }, { val: 0 }])
	expect(calls2).toBe(2)
})

await test('array: vue array instrumentation: find and co.', expect => {
	const _reactive = mutable([{ val: 1 }, { val: 2 }])

	let findCalls = 0
	let findLastCalls = 0
	let findIndexCalls = 0
	let findLastIndexCalls = 0
	let find = memo(() => {
		findCalls++
		return _reactive.find(x => x.val === 2)
	})
	let findLast = memo(() => {
		findLastCalls++
		return _reactive.findLast(x => x.val === 2)
	})
	let findIndex = memo(() => {
		findIndexCalls++
		return _reactive.findIndex(x => x.val === 2)
	})
	let findLastIndex = memo(() => {
		findLastIndexCalls++
		return _reactive.findLastIndex(x => x.val === 2)
	})

	expect(find()).toBe(_reactive[1])
	expect(isProxy(find())).toBe(true)
	expect(findLast()).toBe(_reactive[1])
	expect(isProxy(findLast())).toBe(true)
	expect(findIndex()).toBe(1)
	expect(findLastIndex()).toBe(1)
	expect(findCalls).toBe(1)
	expect(findLastCalls).toBe(1)
	expect(findIndexCalls).toBe(1)
	expect(findLastIndexCalls).toBe(1)

	_reactive[1].val = 0

	expect(find()).not.toBe(_reactive[1])
	expect(findLast()).not.toBe(_reactive[1])
	expect(findIndex()).toBe(-1)
	expect(findLastIndex()).toBe(-1)
	expect(findCalls).toBe(2)
	expect(findLastCalls).toBe(2)
	expect(findIndexCalls).toBe(2)
	expect(findLastIndexCalls).toBe(2)

	_reactive.pop()

	expect(find()).toBe(undefined)
	expect(findLast()).toBe(undefined)
	expect(findIndex()).toBe(-1)
	expect(findLastIndex()).toBe(-1)

	const deep = mutable([{ val: 1 }, { val: 2 }])
	let deepFindCalls = 0
	let deepFindLastCalls = 0
	let deepFindIndexCalls = 0
	let deepFindLastIndexCalls = 0
	find = memo(() => {
		deepFindCalls++
		return deep.find(x => x.val === 2)
	})
	findLast = memo(() => {
		deepFindLastCalls++
		return deep.findLast(x => x.val === 2)
	})
	findIndex = memo(() => {
		deepFindIndexCalls++
		return deep.findIndex(x => x.val === 2)
	})
	findLastIndex = memo(() => {
		deepFindLastIndexCalls++
		return deep.findLastIndex(x => x.val === 2)
	})

	expect(find()).toBe(deep[1])
	expect(isProxy(find())).toBe(true)
	expect(findLast()).toBe(deep[1])
	expect(isProxy(findLast())).toBe(true)
	expect(findIndex()).toBe(1)
	expect(findLastIndex()).toBe(1)
	expect(deepFindCalls).toBe(1)
	expect(deepFindLastCalls).toBe(1)
	expect(deepFindIndexCalls).toBe(1)
	expect(deepFindLastIndexCalls).toBe(1)

	deep[1].val = 0

	expect(find()).toBe(undefined)
	expect(findLast()).toBe(undefined)
	expect(findIndex()).toBe(-1)
	expect(findLastIndex()).toBe(-1)
	expect(deepFindCalls).toBe(2)
	expect(deepFindLastCalls).toBe(2)
	expect(deepFindIndexCalls).toBe(2)
	expect(deepFindLastIndexCalls).toBe(2)
})

await test('array: vue array instrumentation: forEach', expect => {
	const shallow = mutable([1, 2, 3, 4])
	let calls1 = 0
	let result = memo(() => {
		calls1++
		let sum = 0
		shallow.forEach(x => (sum += x ** 2))
		return sum
	})
	expect(result()).toBe(30)
	expect(calls1).toBe(1)

	shallow[2] = 0
	expect(result()).toBe(21)
	expect(calls1).toBe(2)

	const deep = mutable([{ val: 1 }, { val: 2 }])
	let calls2 = 0
	result = memo(() => {
		calls2++
		let sum = 0
		deep.forEach(x => (sum += x.val ** 2))
		return sum
	})
	expect(result()).toBe(5)
	expect(calls2).toBe(1)

	deep[1].val = 3
	expect(result()).toBe(10)
	expect(calls2).toBe(2)
})

await test('array: vue array instrumentation: join', expect => {
	/** @this {{ val: number }} */
	function toString() {
		return this.val
	}
	const shallow = mutable([
		{ val: 1, toString },
		{ val: 2, toString },
	])
	let calls1 = 0
	let result = memo(() => {
		calls1++
		return shallow.join('+')
	})
	expect(result()).toBe('1+2')
	expect(calls1).toBe(1)

	shallow[1].val = 23
	expect(result()).toBe('1+23')
	expect(calls1).toBe(2)

	shallow.pop()
	expect(result()).toBe('1')
	expect(calls1).toBe(3)

	const deep = mutable([
		{ val: 1, toString },
		{ val: 2, toString },
	])
	let calls2 = 0
	result = memo(() => {
		calls2++
		return deep.join()
	})
	expect(result()).toBe('1,2')
	expect(calls2).toBe(1)

	deep[1].val = 23
	expect(result()).toBe('1,23')
	expect(calls2).toBe(2)
})

await test('array: vue array instrumentation: map', expect => {
	// uno
	const shallow = mutable([1, 2, 3, 4])
	let calls1 = 0
	let result = memo(() => {
		calls1++
		return shallow.map(x => x ** 2)
	})
	expect(result()).toEqual([1, 4, 9, 16])
	expect(calls1).toBe(1)

	shallow[2] = 0

	expect(result()).toEqual([1, 4, 0, 16])
	expect(calls1).toBe(2)

	// uno + empty
	const shallow2 = mutable([])
	let calls2 = 0
	let result2 = memo(() => {
		calls2++
		return shallow2.map(x => x ** 2)
	})
	expect(result2()).toEqual([])
	expect(calls2).toBe(1)

	shallow2[0] = 1
	shallow2[1] = 2

	expect(result2()).toEqual([1, 4])

	// dos

	const deep = mutable([{ val: 1 }, { val: 2 }])
	let calls3 = 0
	result = memo(() => {
		calls3++
		return deep.map(x => x.val ** 2)
	})
	expect(result()).toEqual([1, 4])
	expect(calls3).toBe(1)

	deep[1].val = 3
	expect(result()).toEqual([1, 9])
	expect(calls3).toBe(2)
})

await test('array: vue array instrumentation: reduce left and right', expect => {
	/** @this {{ val: number }} */
	function toString() {
		return this.val + '-'
	}
	/** @type {{ val: number; toString: typeof toString }[]} */
	const reactive = mutable([
		{ val: 1, toString },
		{ val: 2, toString },
	])

	expect(
		reactive.reduce(
			(/** @type {any} */ acc, x) => acc + '' + x.val,
			undefined,
		),
	).toBe('undefined12')

	let leftCalls = 0
	let rightCalls = 0
	/** @type {{ (): any; memo?: void }} */
	let left = memo(() => {
		leftCalls++
		return /** @type {any[]} */ (reactive).reduce(
			(acc, x) => acc + '' + x.val,
		)
	})
	/** @type {{ (): any; memo?: void }} */
	let right = memo(() => {
		rightCalls++
		return /** @type {any[]} */ (reactive).reduceRight(
			(acc, x) => acc + '' + x.val,
		)
	})
	expect(left()).toBe('1-2')
	expect(right()).toBe('2-1')
	expect(leftCalls).toBe(1)
	expect(rightCalls).toBe(1)

	reactive[1].val = 23
	expect(left()).toBe('1-23')
	expect(right()).toBe('23-1')
	expect(leftCalls).toBe(2)
	expect(rightCalls).toBe(2)

	reactive.pop()
	expect(left()).toBe(reactive[0])
	expect(right()).toBe(reactive[0])

	const deep = mutable([{ val: 1 }, { val: 2 }])
	let deepLeftCalls = 0
	let deepRightCalls = 0
	left = memo(() => {
		deepLeftCalls++
		return deep.reduce((acc, x) => acc + x.val, '0')
	})
	right = memo(() => {
		deepRightCalls++
		return deep.reduceRight((acc, x) => acc + x.val, '3')
	})
	expect(left()).toBe('012')
	expect(right()).toBe('321')
	expect(deepLeftCalls).toBe(1)
	expect(deepRightCalls).toBe(1)

	deep[1].val = 23
	expect(left()).toBe('0123')
	expect(right()).toBe('3231')
	expect(deepLeftCalls).toBe(2)
	expect(deepRightCalls).toBe(2)
})

await test('array: vue array instrumentation: some', expect => {
	const shallow = mutable([1, 2, 5])
	let calls1 = 0
	let result = memo(() => {
		calls1++
		return shallow.some(x => x > 4)
	})
	expect(result()).toBe(true)
	expect(calls1).toBe(1)

	shallow.pop()
	expect(result()).toBe(false)
	expect(calls1).toBe(2)

	const deep = mutable([{ val: 1 }, { val: 5 }])
	let calls2 = 0
	result = memo(() => {
		calls2++
		return deep.some(x => x.val > 4)
	})
	expect(result()).toBe(true)
	expect(calls2).toBe(1)

	deep[1].val = 2
	expect(result()).toBe(false)
	expect(calls2).toBe(2)
})

// Node 20+
await test('array: vue array instrumentation: toReversed', expect => {
	const array = mutable([1, { val: 2 }])
	let calls = 0
	const result = memo(() => {
		calls++
		return array.toReversed()
	})
	expect(array).not.toBe(result())
	expect(result()).toEqual([{ val: 2 }, 1])
	expect(isProxy(result()[0])).toBe(true)
	expect(result()[0]).toEqual({ val: 2 })
	expect(calls).toBe(1)

	// modify original array, doesnt modify copied array
	// but the memo should rerun yielding 2,1
	array.splice(1, 1, 2)

	expect(array).toEqual([1, 2])
	expect(result()).toEqual([2, 1])
	expect(calls).toBe(2)
})

// Node 20+
await test('array: vue array instrumentation: toSorted', expect => {
	// No comparer

	expect(mutable([2, 1, 3]).toSorted()).toEqual([1, 2, 3])

	const r = mutable([{ val: 2 }, { val: 1 }, { val: 3 }])
	let calls1 = 0
	let result

	result = memo(() => {
		calls1++
		return r.toSorted((a, b) => a.val - b.val)
	})
	expect(result().map(x => x.val)).toEqual([1, 2, 3])
	expect(isProxy(result()[0])).toBe(true)
	expect(calls1).toBe(1)

	r[0].val = 4
	expect(result().map(x => x.val)).toEqual([1, 3, 4])
	expect(calls1).toBe(2)

	r.pop()
	expect(result().map(x => x.val)).toEqual([1, 4])

	const deep = mutable([{ val: 2 }, { val: 1 }, { val: 3 }])
	let calls2 = 0

	result = memo(() => {
		calls2++
		return deep.toSorted((a, b) => a.val - b.val)
	})
	expect(result().map(x => x.val)).toEqual([1, 2, 3])
	expect(isProxy(result()[0])).toBe(true)
	expect(calls2).toBe(1)

	deep[0].val = 4
	expect(result().map(x => x.val)).toEqual([1, 3, 4])
	expect(calls2).toBe(2)
})

// Node 20+

await test('array: vue array instrumentation: toSpliced', expect => {
	const array = mutable([1, 2, 3])
	expect(array).toEqual([1, 2, 3])

	let calls = 0
	const result = memo(() => {
		calls++
		return array.toSpliced(1, 1, -2)
	})
	expect(result()).toEqual([1, -2, 3])
	expect(calls).toBe(1)

	expect(array).toEqual([1, 2, 3])

	array[0] = 0
	expect(array).toEqual([0, 2, 3])

	expect(result()).toEqual([0, -2, 3])
	expect(calls).toBe(2)

	expect(array).toEqual([0, 2, 3])
})

await test('array: vue array instrumentation: values', expect => {
	const reactive = mutable([{ val: 1 }, { val: 2 }])
	let calls = 0
	const result = memo(() => {
		calls++
		return Array.from(reactive.values())
	})
	expect(result()).toEqual([{ val: 1 }, { val: 2 }])
	expect(isProxy(result()[0])).toBe(true)
	expect(calls).toBe(1)

	reactive.pop()
	expect(result()).toEqual([{ val: 1 }])
	expect(calls).toBe(2)

	const deep = mutable([{ val: 1 }, { val: 2 }])
	const firstItem = Array.from(deep.values())[0]
	expect(isProxy(firstItem)).toBe(true)
})

// Map tests

if (supportsMap) {
	await test('Map: instanceof', expect => {
		const original = new Map()
		const observed = mutable(original)
		const observed2 = mutable({ value: original })
		const observed3 = mutable([original])

		expect(original instanceof Map).toBe(true)
		expect(observed instanceof Map).toBe(true)
		expect(observed2.value instanceof Map).toBe(true)
		expect(observed3[0] instanceof Map).toBe(true)

		expect(isProxy(original)).toBe(false)
		expect(isProxy(observed)).toBe(true)
		expect(isProxy(observed2.value)).toBe(true)
		expect(isProxy(observed3[0])).toBe(true)
	})
}

if (supportsMap) {
	await test('Map: should observe mutations', expect => {
		let dummy
		const map = mutable(new Map())
		const execute = memo(() => {
			dummy = map.get('key')
		})
		execute()

		expect(dummy).toBe(undefined)
		map.set('key', 'value')
		execute()

		expect(dummy).toBe('value')
		map.set('key', 'value2')
		execute()

		expect(dummy).toBe('value2')
		map.delete('key')
		execute()

		expect(dummy).toBe(undefined)
	})
}

if (supportsMap) {
	await test('Map: should observe mutations with observed value as key', expect => {
		let dummy
		const key = mutable({})
		const value = mutable({})
		const map = mutable(new Map())
		const execute = memo(() => {
			dummy = map.get(key)
		})
		execute()

		expect(dummy).toBe(undefined)
		map.set(key, value)
		execute()

		expect(dummy).toBe(value)
		map.delete(key)
		execute()

		expect(dummy).toBe(undefined)
	})
}

if (supportsMap) {
	await test('Map: should observe size mutations', expect => {
		let dummy
		const map = mutable(new Map())
		const execute = memo(() => (dummy = map.size))
		execute()

		expect(dummy).toBe(0)

		map.set('key1', 'value')
		execute()

		map.set('key2', 'value2')
		execute()
		expect(dummy).toBe(2)

		map.delete('key1')
		execute()
		expect(dummy).toBe(1)

		map.clear()
		execute()
		expect(dummy).toBe(0)
	})
}

if (supportsMap) {
	await test('Map: should observe for of iteration', expect => {
		let dummy
		const map = mutable(new Map())
		const execute = memo(() => {
			dummy = 0
			for (let [key, num] of map) {
				key
				dummy += num
			}
		})
		execute()

		expect(dummy).toBe(0)
		map.set('key1', 3)
		execute()

		expect(dummy).toBe(3)
		map.set('key2', 2)
		execute()

		expect(dummy).toBe(5)

		// iteration should track mutation of existing entries (#709)
		map.set('key1', 4)
		execute()
		expect(dummy).toBe(6)

		map.delete('key1')
		execute()
		expect(dummy).toBe(2)

		map.clear()
		execute()
		expect(dummy).toBe(0)
	})
}

if (supportsMap) {
	await test('Map: should observe forEach iteration', expect => {
		let dummy
		const map = mutable(new Map())
		const execute = memo(() => {
			dummy = 0
			map.forEach(num => (dummy += num))
		})
		execute()

		expect(dummy).toBe(0)
		map.set('key1', 3)
		execute()

		expect(dummy).toBe(3)
		map.set('key2', 2)
		execute()

		expect(dummy).toBe(5)
		// iteration should track mutation of existing entries (#709)
		map.set('key1', 4)
		execute()

		expect(dummy).toBe(6)
		map.delete('key1')
		execute()

		expect(dummy).toBe(2)
		map.clear()
		execute()

		expect(dummy).toBe(0)
	})
}

if (supportsMap) {
	await test('Map: should observe keys iteration', expect => {
		let dummy
		const map = mutable(new Map())
		const execute = memo(() => {
			dummy = 0
			for (let key of map.keys()) {
				dummy += key
			}
		})
		execute()

		expect(dummy).toBe(0)
		map.set(3, 3)
		execute()

		expect(dummy).toBe(3)
		map.set(2, 2)
		execute()

		expect(dummy).toBe(5)
		map.delete(3)
		execute()

		expect(dummy).toBe(2)
		map.clear()
		execute()

		expect(dummy).toBe(0)
	})
}

if (supportsMap) {
	await test('Map: should observe values iteration', expect => {
		let dummy
		const map = mutable(new Map())
		const execute = memo(() => {
			dummy = 0
			for (let num of map.values()) {
				dummy += num
			}
		})
		execute()
		expect(dummy).toBe(0)

		map.set('key1', 3)
		execute()
		expect(dummy).toBe(3)

		map.set('key2', 2)
		execute()
		expect(dummy).toBe(5)

		// iteration should track mutation of existing entries (#709)
		map.set('key1', 4)
		execute()
		expect(dummy).toBe(6)

		map.delete('key1')
		execute()
		expect(dummy).toBe(2)

		map.clear()
		execute()
		expect(dummy).toBe(0)
	})
}

if (supportsMap) {
	await test('Map: should observe entries iteration', expect => {
		let dummy
		let dummy2
		const map = mutable(new Map())
		const execute = memo(() => {
			dummy = ''
			dummy2 = 0
			for (let [key, num] of map.entries()) {
				dummy += key
				dummy2 += num
			}
		})
		execute()

		expect(dummy).toBe('')
		expect(dummy2).toBe(0)
		map.set('key1', 3)
		execute()

		expect(dummy).toBe('key1')
		expect(dummy2).toBe(3)
		map.set('key2', 2)
		execute()

		expect(dummy).toBe('key1key2')
		expect(dummy2).toBe(5)
		// iteration should track mutation of existing entries (#709)
		map.set('key1', 4)
		execute()

		expect(dummy).toBe('key1key2')
		expect(dummy2).toBe(6)
		map.delete('key1')
		execute()

		expect(dummy).toBe('key2')
		expect(dummy2).toBe(2)
		map.clear()
		execute()

		expect(dummy).toBe('')
		expect(dummy2).toBe(0)
	})
}

if (supportsMap) {
	await test('Map: should be triggered by clearing', expect => {
		let dummy
		const map = mutable(new Map())
		const execute = memo(() => (dummy = map.get('key')))

		expect(dummy).toBe(undefined)
		map.set('key', 3)
		execute()

		expect(dummy).toBe(3)
		map.clear()

		expect(dummy).toBe(undefined)
	})
}

if (supportsMap) {
	await test('Map: should observe custom property mutations', expect => {
		let dummy
		const map = mutable(new Map())
		const execute = memo(() => (dummy = map.customProp))
		execute()

		expect(dummy).toBe(undefined)
		map.customProp = 'Hello World'
		execute()

		expect(dummy).toBe('Hello World')
	})
}

if (supportsMap) {
	await test('Map: should not observe non value changing mutations', expect => {
		let dummy
		const map = mutable(new Map())
		let calls = 0
		const execute = memo(() => {
			calls++
			dummy = map.get('key')
		})
		execute()

		expect(dummy).toBe(undefined)
		expect(calls).toBe(1)

		map.set('key', undefined)
		execute()
		expect(dummy).toBe(undefined)
		expect(calls).toBe(1)

		map.set('key', 'value')
		execute()
		expect(dummy).toBe('value')
		expect(calls).toBe(2)

		map.set('key', 'value')
		execute()
		expect(dummy).toBe('value')
		expect(calls).toBe(2)

		map.set('key', undefined)
		execute()
		expect(dummy).toBe(undefined)
		expect(calls).toBe(3)

		map.delete('key')
		execute()
		expect(dummy).toBe(undefined)
		expect(calls).toBe(3)

		map.delete('key')
		execute()
		expect(dummy).toBe(undefined)
		expect(calls).toBe(3)

		map.clear()
		execute()
		expect(dummy).toBe(undefined)
		expect(calls).toBe(3)
	})
}

if (supportsMap) {
	await test('Map: should not pollute original Map with Proxies', expect => {
		const map = new Map()
		const observed = mutable(map)
		const original = {}
		const value = mutable(original)
		observed.set('key', value)
		expect(map.get('key')).toBe(value)
		expect(map.get('key')).not.toBe(original)
	})
}

if (supportsMap) {
	await test('Map: should return observable versions of contained values', expect => {
		const observed = mutable(new Map())
		const value = {}
		observed.set('key', value)
		const wrapped = observed.get('key')
		expect(wrapped).not.toBe(value)
	})
}

if (supportsMap) {
	await test('Map: should observed nested data', expect => {
		const observed = mutable(new Map())
		observed.set('key', { a: 1 })
		let dummy
		const execute = memo(() => {
			dummy = observed.get('key').a
		})
		execute()

		observed.get('key').a = 2
		expect(dummy).toBe(2)
	})
}

if (supportsMap) {
	await test('Map: should observe nested values in iterations (forEach)', expect => {
		const map = mutable(new Map([[1, { foo: 1 }]]))
		let dummy
		const execute = memo(() => {
			dummy = 0
			map.forEach(value => {
				dummy += value.foo
			})
		})
		execute()

		expect(dummy).toBe(1)
		map.get(1).foo++
		expect(dummy).toBe(2)
	})
}

if (supportsMap) {
	await test('Map: should observe nested values in iterations (values)', expect => {
		const map = mutable(new Map([[1, { foo: 1 }]]))
		let dummy
		const execute = memo(() => {
			dummy = 0
			for (const value of map.values()) {
				dummy += value.foo
			}
		})
		execute()

		expect(dummy).toBe(1)
		map.get(1).foo++
		expect(dummy).toBe(2)
	})
}

if (supportsMap) {
	await test('Map: should observe nested values in iterations (entries)', expect => {
		const key = {}
		const map = mutable(new Map([[key, { foo: 1 }]]))
		let dummy
		const execute = memo(() => {
			dummy = 0
			for (const [key, value] of map.entries()) {
				key

				dummy += value.foo
			}
		})
		execute()

		expect(dummy).toBe(1)
		map.get(key).foo++
		expect(dummy).toBe(2)
	})
}

if (supportsMap) {
	await test('Map: should observe nested values in iterations (for...of)', expect => {
		const key = {}
		const map = mutable(new Map([[key, { foo: 1 }]]))
		let dummy
		const execute = memo(() => {
			dummy = 0
			for (const [key, value] of map) {
				key

				dummy += value.foo
			}
		})
		execute()

		expect(dummy).toBe(1)
		map.get(key).foo++
		expect(dummy).toBe(2)
	})
}

if (supportsMap) {
	await test('Map: should not be trigger when the value and the old value both are NaN', expect => {
		const map = mutable(new Map([['foo', NaN]]))
		let calls = 0
		const execute = memo(() => {
			calls++
			map.get('foo')
		})
		execute()

		map.set('foo', NaN)
		execute()

		expect(calls).toBe(1)
	})
}

if (supportsMap) {
	await test('Map: should work with reactive keys in raw map', expect => {
		const raw = new Map()
		const key = mutable({})
		raw.set(key, 1)
		const map = mutable(raw)

		expect(map.has(key)).toBe(true)
		expect(map.get(key)).toBe(1)

		expect(map.delete(key)).toBe(true)
		expect(map.has(key)).toBe(false)
		expect(map.get(key)).toBe(undefined)
	})
}

if (supportsMap) {
	await test('Map: should track set of mutable keys in raw map', expect => {
		const raw = new Map()
		const key = mutable({})
		raw.set(key, 1)
		const map = mutable(raw)

		let dummy
		const execute = memo(() => {
			dummy = map.get(key)
		})
		execute()

		expect(dummy).toBe(1)

		map.set(key, 2)
		execute()

		expect(dummy).toBe(2)
	})
}

if (supportsMap) {
	await test('Map: should track deletion of reactive keys in raw map', expect => {
		const raw = new Map()
		const key = mutable({})
		raw.set(key, 1)
		const map = mutable(raw)

		let dummy
		const execute = memo(() => {
			dummy = map.has(key)
		})
		execute()

		expect(dummy).toBe(true)

		map.delete(key)
		execute()

		expect(dummy).toBe(false)
	})
}

// #877
if (supportsMap) {
	await test('Map: should not trigger key iteration when setting existing keys ', expect => {
		const map = mutable(new Map())

		let calls = 0
		const execute = memo(() => {
			calls++
			const keys = []
			for (const key of map.keys()) {
				keys.push(key)
			}
		})
		execute()
		expect(calls).toBe(1)

		map.set('a', 0)
		execute()
		expect(calls).toBe(2)

		map.set('b', 0)
		execute()
		expect(calls).toBe(3)

		// keys didn't change, should not trigger
		map.set('b', 1)
		execute()

		expect(calls).toBe(3)
	})
}

if (supportsMap) {
	await test('Map: should return proxy from Map.set call ', expect => {
		const map = mutable(new Map())
		const result = map.set('a', 'a')
		expect(result).toBe(map)
	})
}

if (supportsMap) {
	await test('Map: observing subtypes of IterableCollections(Map, Set)', expect => {
		// subtypes of Map
		class CustomMap extends Map {}
		const cmap = mutable(new CustomMap())

		expect(cmap instanceof Map).toBe(true)

		const val = {}
		cmap.set('key', val)
		expect(isProxy(cmap.get('key'))).toBe(true)
		expect(cmap.get('key')).not.toBe(val)
	})
}

if (supportsMap) {
	await test('Map: observing subtypes of IterableCollections(Map, Set) deep', expect => {
		// subtypes of Map
		class CustomMap extends Map {}
		const cmap = mutable({ value: new CustomMap() })

		expect(cmap.value instanceof Map).toBe(true)

		const val = {}
		cmap.value.set('key', val)
		expect(isProxy(cmap.value.get('key'))).toBe(true)
		expect(cmap.value.get('key')).not.toBe(val)
	})
}

if (supportsMap) {
	await test('Map: should work with observed value as key', expect => {
		const key = mutable({})
		const m = mutable(new Map())
		m.set(key, 1)
		const roM = m

		let calls = 0
		const execute = memo(() => {
			calls++
			roM.get(key)
		})
		execute()

		expect(calls).toBe(1)
		m.set(key, 1)
		execute()

		expect(calls).toBe(1)
		m.set(key, 2)
		execute()

		expect(calls).toBe(2)
	})
}

// solid-primitives

if (supportsMap) {
	await test('Map: behaves like a Map', expect => {
		const obj1 = {}
		const obj2 = {}

		/** @type {Map<any, any>} */
		const map = mutable(
			new Map(
				/** @type {[any, any][]} */ ([
					[obj1, 123],
					[1, 'foo'],
				]),
			),
		)

		expect(map.has(obj1)).toBe(true)
		expect(map.has(1)).toBe(true)
		expect(map.has(2)).toBe(false)

		expect(map.get(obj1)).toBe(123)
		expect(map.get(1)).toBe('foo')

		map.set(obj2, 'bar')
		expect(map.get(obj2)).toBe('bar')
		map.set(obj1, 'change')
		expect(map.get(obj1)).toBe('change')

		expect(map.delete(obj2)).toBe(true)
		expect(map.has(obj2)).toBe(false)

		expect(map.size).toBe(2)
		map.clear()
		expect(map.size).toBe(0)

		expect(map instanceof Map).toBe(true)
	})
}

if (supportsMap) {
	await test('Map: has() is reactive', expect => {
		const map = mutable(
			new Map([
				[1, {}],
				[1, {}],
				[2, {}],
				[3, {}],
			]),
		)

		const captured = []
		const execute = memo(() => {
			captured.push(map.has(2))
		})
		execute()

		expect(captured).toEqual([true])

		map.set(4, {})
		expect(captured).toEqual([true])

		map.delete(4)
		expect(captured).toEqual([true])

		map.delete(2)
		expect(captured).toEqual([true, false])

		map.set(2, {})
		expect(captured).toEqual([true, false, true])

		map.clear()
		expect(captured).toEqual([true, false, true, false])
	})
}

if (supportsMap) {
	await test('Map: get() is reactive', expect => {
		const obj1 = {}
		const obj2 = {}
		const obj3 = {}
		const obj4 = {}

		const map = mutable(
			new Map([
				[1, obj1],
				[1, obj2],
				[2, obj3],
				[3, obj4],
			]),
		)

		let calls = 0
		let dummy
		const execute = memo(() => {
			calls++
			dummy = map.get(2)
		})
		execute()

		map.set(4, {})
		expect(calls).toBe(1)

		map.delete(4)
		expect(calls).toBe(1)

		map.delete(2)
		expect(dummy).toBe(undefined)
		expect(calls).toBe(2)

		map.set(2, obj4)
		expect(dummy).toBe(mutable(obj4))

		map.set(2, obj4)
		expect(calls).toBe(3)

		map.clear()
		expect(dummy).toBe(undefined)
		expect(calls).toBe(4)
	})
}

if (supportsMap) {
	await test('Map: spread values is reactive', expect => {
		const map = mutable(
			new Map([
				[1, 'a'],
				[1, 'b'],
				[2, 'c'],
				[3, 'd'],
			]),
		)

		const captured = []

		const execute = memo(() => captured.push([...map.values()]))
		execute()

		expect(captured.length).toBe(1)
		expect(captured[0]).toEqual(['b', 'c', 'd'])

		map.set(4, 'e')
		expect(captured.length).toBe(2)
		expect(captured[1]).toEqual(['b', 'c', 'd', 'e'])

		map.set(4, 'e')
		expect(captured.length).toBe(2)

		map.delete(4)
		expect(captured.length).toBe(3)
		expect(captured[2]).toEqual(['b', 'c', 'd'])

		map.delete(2)
		expect(captured.length).toBe(4)
		expect(captured[3]).toEqual(['b', 'd'])

		map.delete(2)
		expect(captured.length).toBe(4)

		map.set(2, 'a')
		expect(captured.length).toBe(5)
		expect(captured[4]).toEqual(['b', 'd', 'a'])

		map.set(2, 'b')
		expect(captured.length).toBe(6)
		expect(captured[5]).toEqual(['b', 'd', 'b'])

		map.clear()
		expect(captured.length).toBe(7)
		expect(captured[6]).toEqual([])
	})
}

if (supportsMap) {
	await test('Map: .size is reactive', expect => {
		const map = mutable(
			new Map([
				[1, {}],
				[1, {}],
				[2, {}],
				[3, {}],
			]),
		)

		const captured = []
		const execute = memo(() => {
			captured.push(map.size)
		})
		execute()

		expect(captured.length).toBe(1)
		expect(captured[0]).toBe(3)

		map.set(4, {})
		expect(captured.length).toBe(2)
		expect(captured[1]).toBe(4)

		map.delete(4)
		expect(captured.length).toBe(3)
		expect(captured[2]).toBe(3)

		map.delete(2)
		expect(captured.length).toBe(4)
		expect(captured[3]).toBe(2)

		map.delete(2)
		expect(captured.length).toBe(4)

		map.set(2, {})
		expect(captured.length).toBe(5)
		expect(captured[4]).toBe(3)

		map.set(2, {})
		expect(captured.length).toBe(5)

		map.clear()
		expect(captured.length).toBe(6)
		expect(captured[5]).toBe(0)
	})
}

if (supportsMap) {
	await test('Map: .keys() is reactive', expect => {
		/** @type {Map<number, any>} */
		const map = mutable(
			new Map([
				[1, 'a'],
				[2, 'b'],
				[3, 'c'],
				[4, 'd'],
			]),
		)

		const captured = []

		const execute = memo(() => {
			const run = []
			for (const key of map.keys()) {
				run.push(key)
				if (key === 3) break // don't iterate over all keys
			}
			captured.push(run)
		})
		execute()

		expect(captured.length).toBe(1)
		expect(captured[0]).toEqual([1, 2, 3])

		map.set(1, undefined)
		expect(captured.length).toBe(1)

		map.set(5, undefined)
		expect(captured.length).toBe(1)

		map.delete(1)
		expect(captured.length).toBe(2)
		expect(captured[1]).toEqual([2, 3])
	})
}

if (supportsMap) {
	await test('Map: .values() is reactive', expect => {
		const map = mutable(
			new Map([
				[1, 'a'],
				[2, 'b'],
				[3, 'c'],
				[4, 'd'],
			]),
		)

		const captured = []

		const execute = memo(() => {
			const run = []
			let i = 0
			for (const v of map.values()) {
				run.push(v)
				if (i === 2) break // don't iterate over all keys
				i += 1
			}
			captured.push(run)
		})
		execute()

		expect(captured.length).toBe(1)
		expect(captured[0]).toEqual(['a', 'b', 'c'])

		map.set(1, 'e')
		expect(captured.length).toBe(2)
		expect(captured[1]).toEqual(['e', 'b', 'c'])

		map.set(4, 'f')
		expect(captured.length).toBe(2)

		map.delete(4)
		expect(captured.length).toBe(2)

		map.delete(1)
		expect(captured.length).toBe(3)
		expect(captured[2]).toEqual(['b', 'c'])
	})
}

if (supportsMap) {
	await test('Map: .entries() is reactive', expect => {
		const map = mutable(
			new Map([
				[1, 'a'],
				[2, 'b'],
				[3, 'c'],
				[4, 'd'],
			]),
		)

		const captured = []

		const execute = memo(() => {
			const run = []
			let i = 0
			for (const e of map.entries()) {
				run.push(e)
				if (i === 2) break // don't iterate over all keys
				i += 1
			}
			captured.push(run)
		})
		execute()

		expect(captured.length).toBe(1)
		expect(captured[0]).toEqual([
			[1, 'a'],
			[2, 'b'],
			[3, 'c'],
		])

		map.set(1, 'e')
		expect(captured.length).toBe(2)
		expect(captured[1]).toEqual([
			[1, 'e'],
			[2, 'b'],
			[3, 'c'],
		])

		map.set(4, 'f')
		expect(captured.length).toBe(2)

		map.delete(4)
		expect(captured.length).toBe(2)

		map.delete(1)
		expect(captured.length).toBe(3)
		expect(captured[2]).toEqual([
			[2, 'b'],
			[3, 'c'],
		])
	})
}

if (supportsMap) {
	await test('Map: .forEach() is reactive', expect => {
		const map = mutable(
			new Map([
				[1, 'a'],
				[2, 'b'],
				[3, 'c'],
				[4, 'd'],
			]),
		)

		const captured = []

		const execute = memo(() => {
			const run = []
			map.forEach((v, k) => {
				run.push([k, v])
			})
			captured.push(run)
		})
		execute()

		expect(captured.length).toBe(1)
		expect(captured[0]).toEqual([
			[1, 'a'],
			[2, 'b'],
			[3, 'c'],
			[4, 'd'],
		])

		map.set(1, 'e')
		expect(captured.length).toBe(2)
		expect(captured[1]).toEqual([
			[1, 'e'],
			[2, 'b'],
			[3, 'c'],
			[4, 'd'],
		])

		map.delete(4)
		expect(captured.length).toBe(3)
		expect(captured[2]).toEqual([
			[1, 'e'],
			[2, 'b'],
			[3, 'c'],
		])
	})
}

// misc 2

await test('misc 2: avoids type confusion with inherited properties', expect => {
	class Test4 {
		a = 13
		get b() {
			return this.a * 4
		}
		get myA() {
			return this.a
		}
		set myA(value) {
			this.a = value
		}
	}
	class Test3 extends Test4 {}
	class Tests2 extends Test3 {
		a = 1
	}
	class Test extends Tests2 {}

	const m = mutable(new Test())

	let calls = 0
	const execute = memo(() => {
		m.b
		calls++
	})
	execute()

	const increment = () => {
		m.a++
		execute()
	}

	// initial
	expect(m.a).toBe(1)
	expect(m.b).toBe(4)
	expect(m.myA).toBe(1)
	expect(calls).toBe(1)

	// incrementing
	increment()
	expect(m.a).toBe(2)
	expect(m.b).toBe(8)
	expect(m.myA).toBe(2)
	expect(calls).toBe(2)

	increment()
	expect(m.a).toBe(3)
	expect(m.b).toBe(12)
	expect(m.myA).toBe(3)
	expect(calls).toBe(3)
})

// misc

await test('misc 2: doesnt change keys', expect => {
	let result

	// object
	result = mutable({})
	expect(Object.keys(result).length).toBe(0)

	// array
	result = mutable([])
	expect(Object.keys(result).length).toBe(0)

	// deep object
	result = mutable({ value: {} })
	expect(Object.keys(result.value).length).toBe(0)

	// deep array
	result = mutable({ value: [] })
	expect(Object.keys(result.value).length).toBe(0)

	// map
	result = mutable(new Map())
	expect(Object.keys(result).length).toBe(0)
})

await test('misc 2: reacts when getter/setter using external signal', expect => {
	const [read, write] = signal(1)
	// object
	const result = mutable({
		get lala() {
			read()
			return 1
		},
		set lala(value) {
			write(value)
		},
	})

	let calls = 0
	const execute = memo(() => {
		result.lala
		calls++
	})
	execute()
	expect(calls).toBe(1)

	write(1)
	execute()
	expect(calls).toBe(1)

	result.lala = 1
	execute()
	expect(calls).toBe(1)

	result.lala = 2
	execute()
	expect(calls).toBe(2)

	write(2)
	execute()
	expect(calls).toBe(2)
})

await test('misc 2: reacts when its only a getter with an external write', expect => {
	const [read, write] = signal(1)
	// object
	const result = mutable({
		get lala() {
			read()
			return 1
		},
	})

	let calls = 0
	const execute = memo(() => {
		result.lala
		calls++
	})
	execute()
	expect(calls).toBe(1)

	write(1)
	execute()
	expect(calls).toBe(1)

	write(2)
	execute()
	expect(calls).toBe(2)
})

await test('misc 2: proxy invariants', expect => {
	const o = {
		frozen: Object.freeze({}),
	}

	Object.defineProperty(o, 'test', {
		configurable: false,
		writable: false,
		value: { test: 1 },
	})

	// if broken this will crash
	let result = mutable(o)

	expect(result.test).toBe(o.test)

	expect(result.frozen).toBe(o.frozen)
})

await test('misc 2: can mutate child of frozen object 1', expect => {
	const source = mutable(
		Object.freeze({
			user: { name: 'John', last: 'Snow' },
		}),
	)

	expect(source.user.name).toBe('John')
	expect(source.user.last).toBe('Snow')

	let called = 0

	const execute = memo(() => {
		source.user.name
		source.user.last
		called++
	})
	execute()
	expect(called).toBe(1)

	source.user.name = 'quack'
	execute()
	expect(called).toBe(2)

	source.user.last = 'murci'
	execute()
	expect(called).toBe(3)

	expect(source.user.name).toBe('quack')
	expect(source.user.last).toBe('murci')

	expect(() => {
		const anySource = /** @type {any} */ (source)
		anySource.user = 'something else'
	}).toThrow()
	expect(source.user.name).toBe('quack')
	expect(source.user.last).toBe('murci')
})

await test('misc 2: can mutate child of frozen object 2', expect => {
	const source = mutable({
		data: Object.freeze({
			user: { name: 'John', last: 'Snow' },
		}),
	})

	let called = 0

	const execute = memo(() => {
		called++

		source.data.user.name
		source.data.user.last
	})
	execute()
	expect(called).toBe(1)

	expect(source.data.user.name).toBe('John')
	expect(source.data.user.last).toBe('Snow')

	source.data.user.name = 'quack'
	execute()
	expect(called).toBe(2)

	source.data.user.last = 'murci'
	execute()
	expect(called).toBe(3)

	expect(source.data.user.name).toBe('quack')
	expect(source.data.user.last).toBe('murci')

	expect(() => {
		const anyData = /** @type {any} */ (source.data)
		anyData.user = 'something else'
	}).toThrow()
	expect(source.data.user.name).toBe('quack')
	expect(source.data.user.last).toBe('murci')
})

await test('misc 2: can mutate child of frozen object 3', expect => {
	const source = mutable(
		Object.freeze({
			data: Object.freeze({
				user: { store: { name: 'John', last: 'Snow' } },
			}),
		}),
	)

	let called = 0

	const execute = memo(() => {
		called++

		source.data.user.store.name
		source.data.user.store.last
	})
	execute()
	expect(called).toBe(1)

	expect(source.data.user.store.name).toBe('John')
	expect(source.data.user.store.last).toBe('Snow')

	source.data.user.store.name = 'quack'
	execute()
	expect(called).toBe(2)

	source.data.user.store.last = 'murci'
	execute()
	expect(called).toBe(3)

	expect(source.data.user.store.name).toBe('quack')
	expect(source.data.user.store.last).toBe('murci')

	expect(() => {
		const anyData = /** @type {any} */ (source.data)
		anyData.user = 'something else'
	}).toThrow()
	expect(source.data.user.store.name).toBe('quack')
	expect(source.data.user.store.last).toBe('murci')
})

await test('blacklist: doesnt creates a proxy for HTMLElement, Date, RegExp, Promise', expect => {
	const values = [
		document.createElement('div'),
		document.createElement('lala'),
		document.createElement('my-el'),
		new Date(),
		/test/i,
		new Promise(() => {}),
	]
	for (const val of values) {
		expect(isProxy(mutable(val))).toBe(false)
		expect(isProxy(mutable({ nested: val }).nested)).toBe(false)
	}

	// nested
})

/* blacklisted keys: constructor, __proto__, well-known symbols */

await test('blacklist key: constructor - read does not subscribe', expect => {
	const obj = mutable({})
	let calls = 0
	const execute = memo(() => {
		calls++
		obj.constructor
	})
	execute()
	expect(calls).toBe(1)

	obj.constructor = Array
	execute()
	expect(calls).toBe(1)
})

await test('blacklist key: constructor - in does not subscribe', expect => {
	const obj = mutable({})
	let calls = 0
	const execute = memo(() => {
		calls++
		'constructor' in obj
	})
	execute()
	expect(calls).toBe(1)

	obj.constructor = Array
	execute()
	expect(calls).toBe(1)

	delete obj.constructor
	execute()
	expect(calls).toBe(1)
})

await test('blacklist key: constructor - set/delete do not fire keysWrite', expect => {
	const obj = mutable({})
	let calls = 0
	const execute = memo(() => {
		calls++
		Object.keys(obj)
	})
	execute()
	expect(calls).toBe(1)

	obj.constructor = Array
	execute()
	expect(calls).toBe(1)

	delete obj.constructor
	execute()
	expect(calls).toBe(1)
})

await test('blacklist key: constructor - write still persists', expect => {
	const obj = mutable(Object.create(null))
	obj.constructor = Array
	expect(obj.constructor).toBe(Array)
})

await test('blacklist key: __proto__ - read does not subscribe', expect => {
	const obj = mutable({})
	let calls = 0
	const execute = memo(() => {
		calls++
		obj.__proto__
	})
	execute()
	expect(calls).toBe(1)

	obj.__proto__ = { foo: 1 }
	execute()
	expect(calls).toBe(1)
})

await test('blacklist key: __proto__ - Object.getPrototypeOf still reflects truth', expect => {
	const obj = mutable({})
	expect(Object.getPrototypeOf(obj)).toBe(Object.prototype)

	const proto = { foo: 1 }
	Object.setPrototypeOf(obj, proto)
	expect(Object.getPrototypeOf(obj)).toBe(proto)
})

await test('blacklist key: well-known Symbol - in does not subscribe', expect => {
	const arr = /** @type {any[] & Record<symbol, any>} */ (mutable([]))
	let calls = 0
	const execute = memo(() => {
		calls++
		Symbol.iterator in arr
		Symbol.isConcatSpreadable in arr
	})
	execute()
	expect(calls).toBe(1)

	arr[Symbol.isConcatSpreadable] = true
	execute()
	expect(calls).toBe(1)
})

await test('blacklist key: well-known Symbol - set/delete do not fire ownKeys', expect => {
	const arr = /** @type {any[] & Record<symbol, any>} */ (mutable([]))
	let calls = 0
	const execute = memo(() => {
		calls++
		Reflect.ownKeys(arr)
	})
	execute()
	expect(calls).toBe(1)

	arr[Symbol.isConcatSpreadable] = true
	execute()
	expect(calls).toBe(1)

	delete arr[Symbol.isConcatSpreadable]
	execute()
	expect(calls).toBe(1)
})

/* inverse: user symbols and regular keys are observed */

await test('inverse: user Symbol - read is observed', expect => {
	/** @type {symbol} */
	const key = Symbol('user')
	const obj = /** @type {Record<symbol, any>} */ (mutable({}))
	let calls = 0
	let dummy
	const execute = memo(() => {
		calls++
		dummy = obj[key]
	})
	execute()
	expect(calls).toBe(1)
	expect(dummy).toBe(undefined)

	obj[key] = 'hi'
	execute()
	expect(calls).toBe(2)
	expect(dummy).toBe('hi')
})

await test('inverse: user Symbol - in is observed', expect => {
	/** @type {symbol} */
	const key = Symbol('user')
	const obj = /** @type {Record<symbol, any>} */ (mutable({}))
	let calls = 0
	let dummy
	const execute = memo(() => {
		calls++
		dummy = key in obj
	})
	execute()
	expect(calls).toBe(1)
	expect(dummy).toBe(false)

	obj[key] = 'hi'
	execute()
	expect(calls).toBe(2)
	expect(dummy).toBe(true)

	delete obj[key]
	execute()
	expect(calls).toBe(3)
	expect(dummy).toBe(false)
})

await test('inverse: user Symbol - set/delete fire ownKeys', expect => {
	/** @type {symbol} */
	const key = Symbol('user')
	const obj = /** @type {Record<symbol, any>} */ (mutable({}))
	let calls = 0
	const execute = memo(() => {
		calls++
		Reflect.ownKeys(obj)
	})
	execute()
	expect(calls).toBe(1)

	obj[key] = 'hi'
	execute()
	expect(calls).toBe(2)

	delete obj[key]
	execute()
	expect(calls).toBe(3)
})

/* regression: iteration stays reactive despite Symbol.iterator being blacklisted */

await test('regression: for-of on mutable array stays reactive', expect => {
	const arr = mutable([1, 2, 3])
	let sum = 0
	let calls = 0
	const execute = memo(() => {
		calls++
		sum = 0
		for (const x of arr) sum += x
	})
	execute()
	expect(calls).toBe(1)
	expect(sum).toBe(6)

	arr.push(4)
	execute()
	expect(calls).toBe(2)
	expect(sum).toBe(10)
})

if (supportsMap) {
	await test('regression: for-of on mutable Map stays reactive', expect => {
		const map = mutable(new Map([[1, 'a']]))
		let values = ''
		let calls = 0
		const execute = memo(() => {
			calls++
			values = ''
			for (const [, v] of map) values += v
		})
		execute()
		expect(calls).toBe(1)
		expect(values).toBe('a')

		map.set(2, 'b')
		execute()
		expect(calls).toBe(2)
		expect(values).toBe('ab')
	})
}

/* identity: blacklisted function/value returns should preserve identity */

await test('identity: plain object.constructor is Object', expect => {
	const obj = mutable({})
	expect(obj.constructor).toBe(Object)
})

await test('identity: array.constructor is Array', expect => {
	const arr = mutable([])
	expect(arr.constructor).toBe(Array)
})

await test('crash: doesnt crash with  window, globalThis, document, documentElement, body', expect => {
	const values = [
		window,
		globalThis,
		document,
		document.documentElement,
		document.body,
	]
	for (const val of values) {
		expect(isProxy(mutable(val))).toBe(false)
		expect(isProxy(mutable({ nested: val }).nested)).toBe(false)
	}
})

await test('prototype walk in the right order', expect => {
	class c {
		get value() {
			return 3
		}
	}

	class b extends c {
		get value() {
			return 1
		}
	}

	class a extends b {
		get value() {
			return 2
		}
	}

	expect(new a().value).toBe(2)
	expect(mutable(new a()).value).toBe(2)

	expect(new b().value).toBe(1)
	expect(mutable(new b()).value).toBe(1)

	expect(new c().value).toBe(3)
	expect(mutable(new c()).value).toBe(3)

	// d1 sets `value` as a data property on the instance (via
	// Object.defineProperty at the parent level so TS doesn't see it
	// as a class field being overridden by c1's accessor — that
	// runtime layout is exactly what the test is pinning).
	class d1 {
		constructor() {
			Object.defineProperty(this, 'value', {
				value: 4,
				writable: true,
				enumerable: true,
				configurable: true,
			})
		}
	}
	class c1 extends d1 {
		get value() {
			return 3
		}
		set value(_v) {}
	}

	class b1 extends c1 {
		get value() {
			return 1
		}
	}

	class a1 extends b1 {
		get value() {
			return 2
		}
	}

	expect(new a1().value).toBe(4)
	expect(mutable(new a1()).value).toBe(4)

	const oget = {
		_value: 2,
		get value() {
			return this._value
		},
		set value(val) {
			this._value = val
		},

		test: { something: {} },
	}

	expect(oget.value).toBe(2)
	expect(mutable(oget).value).toBe(2)

	let called = 0

	const execute = memo(() => {
		called++
		oget.value
	})
	execute()
	expect(called).toBe(1)

	oget.value = 3
	execute()
	expect(called).toBe(2)
	expect(oget.value).toBe(3)
	expect(mutable(oget).value).toBe(3)
})

// reconcile tests - run with both regular objects and mutable

for (const _mutable of [identity, mutable]) {
	const mutable = _mutable
	await test('reconcile replace - a simple object', expect => {
		const state = mutable({
			data: 2,
			missing: 'soon',
		})

		expect(state.data).toBe(2)
		expect(state.missing).toBe('soon')
		replace(state, { data: 5 })
		expect(state.data).toBe(5)
		expect(state.missing).toBe(undefined)
		expect(state).toEqual({ data: 5 })
	})

	await test('reconcile replace - a super simple object', expect => {
		const state = mutable({
			missing: 'soon',
		})

		expect(state.missing).toBe('soon')
		replace(state, { missing: 5 })
		expect(state.missing).toBe(5)
		expect(state).toEqual({
			missing: 5,
		})
	})

	await test('reconcile replace - array with nulls', expect => {
		const state = mutable([null, 'a'])
		expect(state[0]).toBe(null)
		expect(state[1]).toBe('a')
		replace(state, ['b', null])
		expect(state[0]).toBe('b')
		expect(state[1]).toBe(null)
	})

	await test('reconcile replace - a simple object on a nested path', expect => {
		const state = mutable({
			data: {
				user: {
					firstName: 'John',
					middleName: '',
					lastName: 'Snow',
				},
			},
		})
		expect(state.data.user.firstName).toBe('John')
		expect(state.data.user.lastName).toBe('Snow')
		replace(state.data.user, {
			firstName: 'Jake',
			middleName: 'R',
		})
		expect(state.data.user.firstName).toBe('Jake')
		expect(state.data.user.middleName).toBe('R')
		expect(state.data.user.lastName).toBe(undefined)
	})

	await test('reconcile replace - a simple object on a nested path with no prev state', expect => {
		const state = mutable({})
		expect(state.user).toBe(undefined)
		replace(state, {
			user: { firstName: 'Jake', middleName: 'R' },
		})
		expect(state.user.firstName).toBe('Jake')
		expect(state.user.middleName).toBe('R')
	})

	await test('reconcile replace - reorder a keyed array', expect => {
		const JOHN = { id: 1, firstName: 'John' }
		const NED = { id: 2, firstName: 'Ned' }
		const BRANDON = { id: 3, firstName: 'Brandon' }
		const ARYA = { id: 4, firstName: 'Arya' }
		const state = mutable(
			copy({
				users: [JOHN, NED, BRANDON],
			}),
		)

		expect(state.users[0]).toEqual(JOHN)
		expect(state.users[1]).toEqual(NED)
		expect(state.users[2]).toEqual(BRANDON)

		replace(state.users, [NED, JOHN, BRANDON])

		expect(state.users[0]).toEqual(NED)
		expect(state.users[1]).toEqual(JOHN)
		expect(state.users[2]).toEqual(BRANDON)

		replace(state.users, [NED, BRANDON, JOHN])
		expect(state.users[0]).toEqual(NED)
		expect(state.users[1]).toEqual(BRANDON)
		expect(state.users[2]).toEqual(JOHN)

		replace(state.users, [NED, BRANDON, JOHN, ARYA])
		expect(state.users[0]).toEqual(NED)
		expect(state.users[1]).toEqual(BRANDON)
		expect(state.users[2]).toEqual(JOHN)
		expect(state.users[3]).toEqual(ARYA)

		replace(state.users, [BRANDON, JOHN, ARYA])
		expect(state.users[0]).toEqual(BRANDON)
		expect(state.users[1]).toEqual(JOHN)
		expect(state.users[2]).toEqual(ARYA)
	})

	await test('reconcile replace - overwrite in non-keyed', expect => {
		const JOHN = { id: 1, firstName: 'John', lastName: 'Snow' }
		const NED = { id: 2, firstName: 'Ned', lastName: 'Stark' }
		const BRANDON = {
			id: 3,
			firstName: 'Brandon',
			lastName: 'Start',
		}
		const state = mutable(
			copy({
				users: [{ ...JOHN }, { ...NED }, { ...BRANDON }],
			}),
		)
		expect(state.users[0].id).toBe(1)
		expect(state.users[0].firstName).toBe('John')
		expect(state.users[1].id).toBe(2)
		expect(state.users[1].firstName).toBe('Ned')
		expect(state.users[2].id).toBe(3)
		expect(state.users[2].firstName).toBe('Brandon')
		replace(state.users, [{ ...NED }, { ...JOHN }, { ...BRANDON }])
		expect(state.users[0].id).toBe(2)
		expect(state.users[0].firstName).toBe('Ned')
		expect(state.users[1].id).toBe(1)
		expect(state.users[1].firstName).toBe('John')
		expect(state.users[2].id).toBe(3)
		expect(state.users[2].firstName).toBe('Brandon')
	})

	await test('reconcile replace - top level key mismatch', expect => {
		const JOHN = { id: 1, firstName: 'John', lastName: 'Snow' }
		const NED = { id: 2, firstName: 'Ned', lastName: 'Stark' }

		const user = mutable(JOHN)
		expect(user.id).toBe(1)
		expect(user.firstName).toBe('John')
		replace(user, NED)
		expect(user.id).toBe(2)
		expect(user.firstName).toBe('Ned')
	})

	await test('reconcile replace - nested top level key mismatch', expect => {
		const JOHN = { id: 1, firstName: 'John', lastName: 'Snow' }
		const NED = { id: 2, firstName: 'Ned', lastName: 'Stark' }

		const user = mutable({ user: JOHN })
		expect(user.user.id).toBe(1)
		expect(user.user.firstName).toBe('John')
		replace(user.user, NED)
		expect(user.user.id).toBe(2)
		expect(user.user.firstName).toBe('Ned')
	})

	await test('reconcile replace - top level key missing', expect => {
		const store = mutable({
			id: 0,
			value: 'value',
		})
		replace(store, {})
		expect(store.id).toBe(undefined)
		expect(store.value).toBe(undefined)
	})

	await test('reconcile replace - nested object replaced with different shape', expect => {
		const store = mutable({
			value: { a: { b: 1 } },
		})

		replace(store, { value: { c: [1, 2, 3] } })
		expect(store.value).toEqual({ c: [1, 2, 3] })
	})

	await test('reconcile replace - overwrite an array with an object', expect => {
		const store = mutable({
			value: [1, 2, 3],
		})
		expect(Array.isArray(store.value)).toBe(true)

		replace(store, { value: { name: 'John' } })

		expect(Array.isArray(store.value)).toBe(false)
		expect(store.value).toEqual({ name: 'John' })

		replace(store, { value: [1, 2, 3] })
		expect(Array.isArray(store.value)).toBe(true)
		expect(store.value).toEqual([1, 2, 3])

		replace(store, { value: { q: 'aa' } })
		expect(Array.isArray(store.value)).toBe(false)
		expect(store.value).toEqual({ q: 'aa' })
	})

	await test('reconcile replace - overwrite an object with an array', expect => {
		const store = mutable({
			value: { name: 'John' },
		})
		expect(Array.isArray(store.value)).toBe(false)

		replace(store, { value: [1, 2, 3] })
		expect(Array.isArray(store.value)).toBe(true)
		expect(store.value).toEqual([1, 2, 3])

		replace(store, { value: { name: 'John' } })
		expect(Array.isArray(store.value)).toBe(false)
		expect(store.value).toEqual({ name: 'John' })

		replace(store, { value: { q: 'aa' } })
		expect(Array.isArray(store.value)).toBe(false)
		expect(store.value).toEqual({ q: 'aa' })
	})

	await test('reconcile merge - adding and modifying property', expect => {
		const target = mutable({ a: true, q: [1, 2, 3, 4] })

		expect(target).toEqual({ a: true, q: [1, 2, 3, 4] })

		const source = { b: true, q: [3] }

		merge(target, source)

		expect(target).toEqual({
			a: true,
			q: [3, 2, 3, 4],
			b: true,
		})
	})

	await test('reconcile merge - change array to object', expect => {
		const target = mutable({ a: true, q: [1, 2, 3, 4] })

		expect(target).toEqual({ a: true, q: [1, 2, 3, 4] })

		const source = { b: true, q: { test: 'hola' } }

		merge(target, source)

		expect(target).toEqual({
			a: true,
			q: { test: 'hola' },
			b: true,
		})
	})

	await test('reconcile merge - change object to array', expect => {
		const target = mutable({ a: true, q: { test: 'hola' } })

		expect(target).toEqual({ a: true, q: { test: 'hola' } })

		const source = { b: true, q: [1, 2, 3, 4] }

		merge(target, source)

		expect(target).toEqual({
			a: true,
			q: [1, 2, 3, 4],
			b: true,
		})
	})

	await test('reconcile merge - overwrite', expect => {
		const target = mutable({ a: true, q: [1, 2, 3, 4] })

		expect(target).toEqual({ a: true, q: [1, 2, 3, 4] })

		const source = { a: false, q: [2, 4, 6, 8] }

		merge(target, source)

		expect(target).toEqual({
			a: false,
			q: [2, 4, 6, 8],
		})
	})

	// using keys - merge

	await test('reconcile merge - add new item using keys', expect => {
		const target = mutable({ c: [{ id: 1 }] })

		expect(target).toEqual({
			c: [{ id: 1 }],
		})

		const source = {
			c: [{ id: 2 }],
		}

		merge(target, source, { c: { key: 'id' } })

		expect(target).toEqual({
			c: [{ id: 1 }, { id: 2 }],
		})
	})

	await test('reconcile merge - add new item using keys nested', expect => {
		const target = mutable({
			q: { u: { a: { c: { k: [{ d: [{ id: 1 }] }] } } } },
		})

		expect(target).toEqual({
			q: { u: { a: { c: { k: [{ d: [{ id: 1 }] }] } } } },
		})

		const source = {
			q: { u: { a: { c: { k: [{ d: [{ id: 2 }] }] } } } },
		}

		merge(
			target,
			source,
			/** @type {any} */ ({
				q: { u: { a: { c: { k: { d: { key: 'id' } } } } } },
			}),
		)

		expect(target).toEqual({
			q: {
				u: { a: { c: { k: [{ d: [{ id: 1 }, { id: 2 }] }] } } },
			},
		})
	})

	await test('reconcile merge - add new item using keys nested and modify', expect => {
		const target = mutable({
			q: {
				u: { a: { c: { k: [{ d: [{ id: 1, name: 'a' }] }] } } },
			},
		})

		expect(target).toEqual({
			q: {
				u: { a: { c: { k: [{ d: [{ id: 1, name: 'a' }] }] } } },
			},
		})

		const source = {
			q: {
				u: {
					a: {
						c: {
							k: [{ d: [{ id: 2 }, { id: 1, name: 'b' }] }],
						},
					},
				},
			},
		}

		merge(
			target,
			source,
			/** @type {any} */ ({
				q: { u: { a: { c: { k: { d: { key: 'id' } } } } } },
			}),
		)

		expect(target).toEqual({
			q: {
				u: {
					a: {
						c: {
							k: [{ d: [{ id: 1, name: 'b' }, { id: 2 }] }],
						},
					},
				},
			},
		})
	})

	await test('reconcile merge - add 2 new items using keys', expect => {
		const target = mutable({ c: [{ id: 1 }], d: [{ idx: 2 }] })

		expect(target).toEqual({
			c: [{ id: 1 }],
			d: [{ idx: 2 }],
		})

		const source = {
			c: [{ id: 3 }],
			d: [{ idx: 4 }],
		}

		merge(target, source, {
			c: { key: 'id' },
			d: { key: 'idx' },
		})

		expect(target).toEqual({
			c: [{ id: 1 }, { id: 3 }],
			d: [{ idx: 2 }, { idx: 4 }],
		})
	})

	await test('reconcile merge - merge and add new item using keys', expect => {
		const target = mutable({
			a: true,
			q: [1, 2],
			c: [{ id: 1 }],
		})

		expect(target).toEqual({
			a: true,
			q: [1, 2],
			c: [{ id: 1 }],
		})

		const source = {
			b: false,
			q: [6, 8],
			c: [
				{ id: 2, name: '2' },
				{ id: 1, name: '1' },
			],
		}

		merge(target, source, { c: { key: 'id' } })

		expect(target).toEqual({
			a: true,
			q: [6, 8],
			c: [
				{ id: 1, name: '1' },
				{ id: 2, name: '2' },
			],
			b: false,
		})
	})

	await test('reconcile merge - deep test ', expect => {
		const target = mutable({
			a: true,
			q: [1, 2],
			c: [{ id: 1, keepThis: true, d: [1] }],
			keepThis: true,
		})

		expect(target).toEqual({
			a: true,
			q: [1, 2],
			c: [{ id: 1, keepThis: true, d: [1] }],
			keepThis: true,
		})

		const ref = target.c[0].d

		const source = {
			b: false,
			q: [6, 8],
			c: [
				{ id: 3, name: '3', d: [3] },
				{ id: 2, name: '2', d: [0] },
				{ id: 1, name: '1', d: [] },
			],
		}

		merge(target, source, { c: { key: 'id' } })

		expect(target).toEqual({
			a: true,
			b: false,
			q: [6, 8],
			c: [
				{ id: 3, name: '3', d: [3] },
				{ id: 2, name: '2', d: [0] },
				{
					id: 1,
					name: '1',
					keepThis: true,
					d: [1],
				},
			],
			keepThis: true,
		})

		expect(ref).toBe(target.c[0].d)
	})

	// using keys replace

	await test('reconcile replace - add new item using keys', expect => {
		const target = mutable({ c: [{ id: 1 }] })

		expect(target).toEqual({
			c: [{ id: 1 }],
		})

		const source = {
			c: [{ id: 2 }],
		}

		replace(target, source, { c: { key: 'id' } })

		expect(target).toEqual({
			c: [{ id: 2 }],
		})
	})

	await test('reconcile replace - add new item using keys nested', expect => {
		const target = mutable({
			q: { u: { a: { c: { k: [{ d: [{ id: 1 }] }] } } } },
		})

		expect(target).toEqual({
			q: { u: { a: { c: { k: [{ d: [{ id: 1 }] }] } } } },
		})

		const source = {
			q: { u: { a: { c: { k: [{ d: [{ id: 2 }] }] } } } },
		}

		replace(
			target,
			source,
			/** @type {any} */ ({
				q: { u: { a: { c: { k: { d: { key: 'id' } } } } } },
			}),
		)

		expect(target).toEqual({
			q: { u: { a: { c: { k: [{ d: [{ id: 2 }] }] } } } },
		})
	})

	await test('reconcile replace - add new item using keys nested and modify', expect => {
		const target = mutable({
			q: {
				u: { a: { c: { k: [{ d: [{ id: 1, name: 'a' }] }] } } },
			},
		})

		expect(target).toEqual({
			q: {
				u: { a: { c: { k: [{ d: [{ id: 1, name: 'a' }] }] } } },
			},
		})

		const ref = target.q.u.a.c.k[0].d[0]

		const source = {
			q: {
				u: {
					a: {
						c: {
							k: [{ d: [{ id: 2 }, { id: 1, name: 'b' }] }],
						},
					},
				},
			},
		}

		replace(
			target,
			source,
			/** @type {any} */ ({
				q: { u: { a: { c: { k: { d: { key: 'id' } } } } } },
			}),
		)

		expect(target).toEqual({
			q: {
				u: {
					a: {
						c: {
							k: [{ d: [{ id: 1, name: 'b' }, { id: 2 }] }],
						},
					},
				},
			},
		})

		expect(ref).toBe(target.q.u.a.c.k[0].d[0])
		expect(ref).not.toBe({ id: 1, name: 'b' })
		expect(ref).toEqual({ id: 1, name: 'b' })
	})

	await test('reconcile replace - add 2 new items using keys', expect => {
		const target = mutable({ c: [{ id: 1 }], d: [{ idx: 2 }] })

		expect(target).toEqual({
			c: [{ id: 1 }],
			d: [{ idx: 2 }],
		})

		const source = {
			c: [{ id: 3 }],
			d: [{ idx: 4 }],
		}

		replace(target, source, {
			c: { key: 'id' },
			d: { key: 'idx' },
		})

		expect(target).toEqual({
			c: [{ id: 3 }],
			d: [{ idx: 4 }],
		})
	})

	await test('reconcile replace - delete items using keys', expect => {
		const target = mutable({ c: [{ id: 1 }], d: [{ idx: 2 }] })

		expect(target).toEqual({
			c: [{ id: 1 }],
			d: [{ idx: 2 }],
		})

		/** @type {{ c: { id: number }[]; d: { idx: number }[] }} */
		const source = {
			c: [],
			d: [],
		}

		replace(target, source, {
			c: { key: 'id' },
			d: { key: 'idx' },
		})

		expect(target).toEqual({
			c: [],
			d: [],
		})
	})

	await test('reconcile replace - replace and add new item using keys', expect => {
		const target = mutable({
			a: true,
			q: [1, 2],
			c: [{ id: 1 }],
		})

		expect(target).toEqual({
			a: true,
			q: [1, 2],
			c: [{ id: 1 }],
		})

		const source = {
			b: false,
			q: [6, 8],
			c: [
				{ id: 2, name: '2' },
				{ id: 1, name: '1' },
			],
		}

		replace(target, source, { c: { key: 'id' } })

		expect(target).toEqual({
			q: [6, 8],
			c: [
				{ id: 1, name: '1' },
				{ id: 2, name: '2' },
			],
			b: false,
		})
	})

	await test('reconcile replace - replace, add and delete, using keys', expect => {
		const target = mutable({
			a: true,
			q: [1, 2],
			c: [{ id: 1, shouldDeleteThis: true, d: [1] }],
			shouldDeleteThis: true,
		})

		expect(target).toEqual({
			a: true,
			q: [1, 2],
			c: [{ id: 1, shouldDeleteThis: true, d: [1] }],
			shouldDeleteThis: true,
		})

		const ref = target.c[0].d

		const source = {
			b: false,
			q: [6, 8],
			c: [
				{ id: 3, name: '3', d: [3] },
				{ id: 2, name: '2', d: [0] },
				{ id: 1, name: '1', d: [] },
			],
		}

		replace(target, source, { c: { key: 'id' } })

		expect(target).toEqual({
			q: [6, 8],
			c: [
				{ id: 3, name: '3', d: [3] },
				{ id: 2, name: '2', d: [0] },
				{ id: 1, name: '1', d: [] },
			],
			b: false,
		})

		expect(ref).toBe(target.c[0].d)
	})
}
