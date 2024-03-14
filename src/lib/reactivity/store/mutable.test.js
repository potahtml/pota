/**
 * References
 * https://github.com/solidjs/solid/blob/main/packages/solid/store/test/
 * https://github.com/solidjs-community/solid-primitives/tree/main/packages/mutable/test
 * https://discord.com/channels/722131463138705510/1217920934548082748
 */

/*

import map

{
  "comment": "If you change the reactive lib with the playground dropdown, then you dont need to change the imports here.",
  "imports": {
    "pota": "/dist/preview/standalone/standalone.no-min.js",
    "pota/jsx-runtime": "/dist/preview/standalone/standalone.no-min.js",
    "pota/router": "/dist/preview/standalone/standalone.no-min.js",
    "pota/hooks": "/dist/preview/standalone/standalone.no-min.js",
    "pota/plugins": "/dist/preview/standalone/standalone.no-min.js",
    "pota/plugins/autofocus": "/dist/preview/standalone/standalone.no-min.js",
    "pota/plugins/bind": "/dist/preview/standalone/standalone.no-min.js",
    "pota/plugins/onClickOutside": "/dist/preview/standalone/standalone.no-min.js",
    "pota/plugins/pasteTextPlain": "/dist/preview/standalone/standalone.no-min.js",
    "pota/plugins/useClipboard": "/dist/preview/standalone/standalone.no-min.js",
    "pota/plugins/useFullscreen": "/dist/preview/standalone/standalone.no-min.js",
    "pota/html": "/dist/preview/standalone/standalone.no-min.js",
    "pota/components": "/dist/preview/standalone/standalone.no-min.js",
    "pota/components/theme-dark": "/dist/preview/standalone/standalone.no-min.js",
    "pota/components/theme-light": "/dist/preview/standalone/standalone.no-min.js",
    "pota/components/alert": "/dist/preview/standalone/standalone.no-min.js",
    "pota/test": "/dist/preview/standalone/standalone.no-min.js",
    "x/articles/": "/pages/%40articles/",
    "oby": "https://jspm.dev/oby",
    "solid-js": "https://jspm.dev/npm:solid-js",
    "solid-js/store": "https://jspm.dev/npm:solid-js/store"
  }
}

*/

// tests

import { test } from 'pota'

// oby
import $, {
	effect as effectOby2,
	store as mutableOby,
	memo as memoOby,
	batch as batchOby,
} from 'oby'
const signalOby = initialValue => {
	const s = $(initialValue)
	return [() => s(), s]
}

const effectOby = fn => effectOby2(fn, { sync: true })

// solid
import {
	createEffect as effectSolid,
	createMemo as memoSolid,
	batch as batchSolid,
	createSignal as signalSolid,
} from 'solid-js'
import { createMutable as mutableSolid } from 'solid-js/store'

// pota
import {
	effect as effectPota,
	mutable as mutablePota,
	memo as memoPota,
	batch as batchPota,
	signal as signalPota,
} from 'pota'

// tests

testMutable(
	'solid',
	effectSolid,
	mutableSolid,
	memoSolid,
	batchSolid,
	signalSolid,
)
testMutable(
	'oby',
	effectOby,
	mutableOby,
	memoOby,
	batchOby,
	signalOby,
)
testMutable(
	'pota',
	effectPota,
	mutablePota,
	memoPota,
	batchPota,
	signalPota,
)

function testMutable(lib, effect, mutable, memo, batch, signal) {
	console.log('lib:', lib)

	test(lib + ' equality: different object', expect => {
		const source = { cat: 'quack' }
		const result = mutable(source)
		expect(result).not.toBe(source)
	})

	test(lib + ' equality: different object nested', expect => {
		const source = { cat: 'quack' }
		const result = mutable({ source })
		expect(result.source).not.toBe(source)
	})

	test(lib + ' equality: different array', expect => {
		const source = []
		const result = mutable(source)
		expect(result).not.toBe(source)
	})

	test(lib + ' equality: different array nested', expect => {
		const source = []
		const result = mutable({ source })
		expect(result.source).not.toBe(source)
	})

	test(lib + ' equality: isArray', expect => {
		const source = []
		const result = mutable(source)
		expect(Array.isArray(result)).toBe(true)
	})

	test(lib + ' equality: isArray nested', expect => {
		const source = { data: [] }
		const result = mutable(source)
		expect(Array.isArray(result.data)).toBe(true)
	})

	// value

	test(lib + ' value: object property', expect => {
		const source = { cat: 'quack' }
		const result = mutable(source)

		expect(source.cat).toBe('quack')
		expect(result.cat).toBe('quack')
	})

	test(lib + ' value: array property', expect => {
		const source = [{ cat: 'quack' }]
		const obj = mutable(source)

		expect(source[0].cat).toBe('quack')
		expect(obj[0].cat).toBe('quack')
	})

	test(lib + ' array: functions', expect => {
		const list = mutable([0, 1, 2])
		const filtered = memo(() => list.filter(i => i % 2))
		expect(filtered()).toJSONEqual([1])
	})

	test(lib + ' array: functions nested', expect => {
		const list = mutable({ data: [0, 1, 2] })
		const filtered = memo(() => list.data.filter(i => i % 2))
		expect(filtered()).toJSONEqual([1])
	})

	// mutation

	test(lib + ' mutation: object property', expect => {
		const source = { cat: 'quack' }
		const result = mutable(source)

		expect(source.cat).toBe('quack')
		expect(result.cat).toBe('quack')

		result.cat = 'murci'
		expect(source.cat).toBe('murci')
		expect(result.cat).toBe('murci')
	})

	test(lib + ' mutation: object nested', expect => {
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

	test(lib + ' mutation: object frozen', expect => {
		const source = mutable(
			Object.freeze({
				user: { name: 'John', last: 'Snow' },
			}),
		)

		expect(source.user.name).toBe('John')

		expect(source.user.last).toBe('Snow')

		let called = 0

		effect(() => {
			called++

			source.user.name
			source.user.last
		})

		expect(called).toBe(1)

		source.user.name = 'quack'
		expect(called).toBe(2)

		source.user.last = 'murci'

		expect(called).toBe(3)

		expect(source.user.name).toBe('quack')
		expect(source.user.last).toBe('murci')

		try {
			source.user = 'something else'
			// solid by design modifies frozen objects
			if (lib !== 'solid') {
				expect('frozen value to not be changed').toBe(true)
			}
		} catch (e) {
			// this is expected to fail
		}
	})

	test(lib + ' mutation: object frozen nested', expect => {
		const source = mutable({
			data: Object.freeze({
				user: { name: 'John', last: 'Snow' },
			}),
		})

		let called = 0

		effect(() => {
			called++

			source.data.user.name
			source.data.user.last
		})

		expect(called).toBe(1)

		expect(source.data.user.name).toBe('John')
		expect(source.data.user.last).toBe('Snow')

		source.data.user.name = 'quack'
		expect(called).toBe(2)

		source.data.user.last = 'murci'
		expect(called).toBe(3)

		expect(source.data.user.name).toBe('quack')
		expect(source.data.user.last).toBe('murci')

		try {
			source.data.user = 'something else'
			// solid by design modifies frozen objects
			if (lib !== 'solid') {
				expect('frozen value to not be changed').toBe(true)
			}
		} catch (e) {
			// this is expected to fail
		}
	})

	test(
		lib + ' mutation: object frozen within frozen nested',
		expect => {
			const source = mutable(
				Object.freeze({
					data: Object.freeze({
						user: { store: { name: 'John', last: 'Snow' } },
					}),
				}),
			)

			let called = 0

			effect(() => {
				called++

				source.data.user.store.name
				source.data.user.store.last
			})

			expect(called).toBe(1)

			expect(source.data.user.store.name).toBe('John')
			expect(source.data.user.store.last).toBe('Snow')

			source.data.user.store.name = 'quack'
			expect(called).toBe(2)

			source.data.user.store.last = 'murci'
			expect(called).toBe(3)

			expect(source.data.user.store.name).toBe('quack')
			expect(source.data.user.store.last).toBe('murci')

			try {
				source.data.user = 'something else'
				// solid by design modifies frozen objects
				if (lib !== 'solid') {
					expect('frozen value to not be changed').toBe(true)
				}
			} catch (e) {
				// this is expected to fail
			}
		},
	)

	test(lib + ' mutation: array property', expect => {
		const source = [{ cat: 'quack' }]
		const result = mutable(source)

		expect(source[0].cat).toBe('quack')
		expect(result[0].cat).toBe('quack')

		result[0].cat = 'murci'
		expect(source[0].cat).toBe('murci')
		expect(result[0].cat).toBe('murci')
	})

	test(lib + ' mutation: array todos', expect => {
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

	test(lib + ' mutation: array batch', expect => {
		const result = mutable([1, 2, 3])
		batch(() => {
			expect(result.length).toBe(3)
			const move = result.splice(1, 1)
			expect(result.length).toBe(2)
			result.splice(0, 0, ...move)
			expect(result.length).toBe(3)
			expect(result).toJSONEqual([2, 1, 3])
			result.push(4)
			expect(result.length).toBe(4)
			expect(result).toJSONEqual([2, 1, 3, 4])
		})
		expect(result.length).toBe(4)
		expect(result.pop()).toBe(4)
		expect(result.length).toBe(3)
		expect(result).toJSONEqual([2, 1, 3])
	})

	test(lib + ' mutation: function', expect => {
		const result = mutable({
			fn: () => 1,
		})
		const getValue = memo(() => result.fn())
		expect(getValue()).toBe(1)

		// pota wont trigger changes with functions
		result.fn = () => 2
		if (lib === 'pota') {
			expect(getValue()).toBe(1)
		} else {
			expect(getValue()).toBe(2)
		}
	})

	// getters

	test(lib + ' getters: object', expect => {
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

	test(lib + ' getters: array', expect => {
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

	test(lib + ' getter/setters: class', expect => {
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

	test(lib + ' getter/setters: class in array', expect => {
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

	test(lib + ' getter/setters: object', expect => {
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

	test(lib + ' deleting: undefined object property', expect => {
		const result = mutable({
			name: 'quack',
		})

		expect('last' in result).toBe(false)

		delete result.last

		expect('last' in result).toBe(false)

		expect(result.last).toBe(undefined)
	})

	test(lib + ' deleting: defined object property', expect => {
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

		// in pota accessing creates the property
		if (lib === 'pota') {
			expect('name' in result).toBe(true)
		} else {
			expect('name' in result).toBe(false)
		}
		expect('last' in result).toBe(true)

		expect(result.name).toBe(undefined)
		expect(result.last).toBe('murci')
	})

	/* misc */

	test(lib + ' misc: skipped', expect => {
		const source = new Date()
		const result = mutable(source)
		if (lib === 'oby' || lib === 'solid') {
			expect(result).not.toBe(source)
		} else {
			expect(result).toBe(source)
		}
	})

	test(lib + ' misc: skipped nested', expect => {
		const source = new Date()
		const result = mutable({ time: source })

		expect(result.time).toBe(source)
	})

	/* in */

	test(lib + ' in: getters to not be called 1', expect => {
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

	test(lib + ' in: getters to not be called 2', expect => {
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

	test(lib + ' in: getters to not be called 3', expect => {
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
			result.b = 0
		} catch (e) {
			failed = true
		}
		if (!failed) {
			expect('expect this to fail').toBe()
		}

		expect(access).toBe(0)
		expect('a' in result).toBe(true)
		expect('b' in result).toBe(true)
		expect(access).toBe(0)
	})

	test(lib + ' in: getters to not be called 3.1', expect => {
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

	test(lib + ' in: getters to not be called 4', expect => {
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

		delete result.b

		expect('a' in result).toBe(true)
		expect('b' in result).toBe(false)
		expect(access).toBe(0)

		result.b

		expect('a' in result).toBe(true)
		// in pota accessing causes creation
		if (lib === 'pota') {
			expect('b' in result).toBe(true)
		} else {
			expect('b' in result).toBe(false)
		}
		expect(access).toBe(0)

		result.b = 3

		expect('a' in result).toBe(true)
		expect('b' in result).toBe(true)
		expect(result.b).toBe(3)
		expect(access).toBe(0)
	})

	/* tracking */

	test(lib + ' track: value', expect => {
		const source = { name: 'quack' }
		const result = mutable(source)

		let called = 0
		effect(() => {
			called++
			result.name
		})

		// setting to same value
		result.name = 'quack'
		expect(called).toBe(1)
		expect(result.name).toBe('quack')

		// change
		result.name = 'murci'
		expect(called).toBe(2)
		expect(result.name).toBe('murci')

		// same value again should not retrigger
		result.name = 'murci'
		expect(called).toBe(2)
		expect(result.name).toBe('murci')

		// third
		result.name = 'mishu'
		expect(called).toBe(3)
		expect(result.name).toBe('mishu')
	})

	test(lib + ' track: value nested', expect => {
		const source = { data: { name: 'quack' } }
		const result = mutable(source)

		let called = 0
		effect(() => {
			called++
			result.data.name
		})

		// same value again should not retrigger
		result.data.name = 'quack'
		expect(called).toBe(1)
		expect(result.data.name).toBe('quack')

		result.data.name = 'murci'
		expect(called).toBe(2)
		expect(result.data.name).toBe('murci')

		// same value again should not retrigger
		result.data.name = 'murci'
		expect(called).toBe(2)
		expect(result.data.name).toBe('murci')

		// third
		result.data.name = 'mishu'
		expect(called).toBe(3)
		expect(result.data.name).toBe('mishu')
	})

	test(lib + ' track: undefined value', expect => {
		const source = {}
		const result = mutable(source)

		let called = 0
		effect(() => {
			called++
			result.name
		})
		expect(called).toBe(1)

		result.name = 'murci'
		expect(called).toBe(2)
		expect(result.name).toBe('murci')

		// same value again should not retrigger
		result.name = 'murci'
		expect(called).toBe(2)
		expect(result.name).toBe('murci')

		delete result.name
		expect(called).toBe(3)

		/**
		 * Tricky because signal gets deleted(see previous lines), then we
		 * add it again with the following, but the signal is not the same
		 * one as before, so effect doesnt re-trigger
		 */
		result.name = 'mishu'
		expect(called).toBe(4)
	})

	test(lib + ' track: undefined value nested', expect => {
		const source = {}
		const result = mutable(source)

		let called = 0
		effect(() => {
			called++
			result.data
		})
		expect(called).toBe(1)

		result.data = {}
		result.data.name = 'murci'
		result.data.name = 'murci'
		expect(called).toBe(2)
		expect(result.data.name).toBe('murci')
	})

	test(lib + ' track: state from signal', expect => {
		const [read, write] = signal('init')
		const result = mutable({ data: '' })

		let called = 0
		effect(() => {
			called++
			// console.log('setting from signal with value?? ', read())
			result.data = read()
			// console.log('result data is?? ', result.data)
		})
		expect(called).toBe(1)
		// console.log('WATH', result.data)
		expect(result.data).toBe('init')
		write('signal')
		expect(called).toBe(2)
		expect(result.data).toBe('signal')
	})

	test(lib + ' track: array functions', expect => {
		const result = mutable([{ username: 'lala' }])

		let called = 0
		effect(() => {
			try {
				result[0].username
			} catch (e) {}
			called++
		})

		expect(result[0].username).toBe('lala')
		expect(called).toBe(1)

		result[0].username = 'lala2'
		expect(called).toBe(2)

		// setting to same value
		result[0].username = 'lala2'
		expect(called).toBe(2)

		expect(result[0].username).toBe('lala2')
		expect(called).toBe(2)

		result.pop()
		expect(called).toBe(3)
		expect(result.length).toBe(0)

		result.push({ username: 'lala2' })
		expect(called).toBe(4)

		result.push({ username: 'lala3' })
		expect(called).toBe(5)

		result.push({ username: 'lala4' })
		expect(called).toBe(6)

		result[0].username = 'lala5'
		expect(called).toBe(7)
	})

	test(lib + ' track: array functions read vs write', expect => {
		const result = mutable([1])

		let called = 0
		effect(() => {
			//console.log('what')
			JSON.stringify(result)
			//console.log('yes')
			called++
		})

		expect(result[0]).toBe(1)
		expect(called).toBe(1)

		result.filter(i => i % 2)
		expect(called).toBe(1)
		result.filter(i => i % 2)
		expect(called).toBe(1)

		result.push(2)
		expect(called).toBe(2)
	})

	test(lib + ' track: array functions read', expect => {
		const result = mutable([1])

		let called = 0
		effect(() => {
			result.filter(i => i % 2)
			called++
		})

		expect(result[0]).toBe(1)
		expect(called).toBe(1)

		result.push(2)
		expect(called).toBe(2)

		result.push(3)
		expect(called).toBe(3)

		result.push(4)
		expect(called).toBe(4)
	})

	test(lib + ' track `in`', expect => {
		let access = 0
		const result = mutable({
			a: 1,
			get b() {
				access++
				return 2
			},
		})

		let called = 0
		effect(() => {
			'a' in result
			'b' in result
			called++
		})
		expect(called).toBe(1)

		delete result.a
		expect(called).toBe(2)

		result.a = true
		expect(called).toBe(3)

		expect(access).toBe(0)
	})

	/* classes */

	test(lib + ' read and set class', expect => {
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

		effect(() => {
			m.b
			count++
		})
		effect(() => {
			m.child.f
			childCount++
		})

		const increment = () => {
			m.a++
			m.child.f++
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
	console.log('lib', lib, 'done')
	console.log('--------------------------------------')
	document.body.textContent = ''
}
