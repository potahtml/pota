/** @jsxImportSource pota */
// Tests for pota/use/emitter: lazy subscription, value publishing,
// cleanup on dispose, re-subscription, and no initialValue.

import { microtask, test } from '#test'

import { root } from 'pota'
import { Emitter } from 'pota/use/emitter'

await test('emitter - use subscribes lazily, publishes values and unsubscribes on cleanup', expect => {
	let dispatch
	let offCalls = 0

	const emitter = new Emitter({
		on(next) {
			dispatch = next
			return () => {
				offCalls++
			}
		},
		initialValue: () => 'initial',
	})

	root(dispose => {
		const value = emitter.use()

		expect(value()).toBe('initial')

		dispatch('updated')
		expect(value()).toBe('updated')

		dispose()
	})

	expect(offCalls).toBe(1)
})

await test('emitter - on receives subsequent values inside an owner', async expect => {
	let dispatch
	const seen = []

	const emitter = new Emitter({
		on(next) {
			dispatch = next
			return () => {}
		},
		initialValue: () => 'first',
	})

	await root(async dispose => {
		emitter.on(value => {
			seen.push(value)
		})

		dispatch('second')

		await microtask()

		dispatch('third')

		await microtask()

		dispose()
	})

	expect(seen).toEqual(['second', 'third'])
})

await test('emitter - unsubscribing last listener cleans up native listener', expect => {
	let dispatch
	let onCalls = 0
	let offCalls = 0

	const emitter = new Emitter({
		on(next) {
			onCalls++
			dispatch = next
			return () => {
				offCalls++
			}
		},
		initialValue: () => 'init',
	})

	root(dispose => {
		emitter.use()
		expect(onCalls).toBe(1)
		dispose()
	})

	expect(offCalls).toBe(1)

	// re-subscribe creates a new listener
	root(dispose => {
		emitter.use()
		expect(onCalls).toBe(2)
		dispose()
	})

	expect(offCalls).toBe(2)
})

await test('emitter - use returns undefined when no initialValue is provided', expect => {
	let dispatch
	const emitter = new Emitter({
		on(next) {
			dispatch = next
			return () => {}
		},
	})

	root(dispose => {
		const value = emitter.use()
		expect(value()).toBe(undefined)

		dispatch('first')
		expect(value()).toBe('first')

		dispose()
	})
})

// --- multiple simultaneous subscribers share one native subscription ----

await test('emitter - multiple subscribers share the same native listener', expect => {
	let onCalls = 0
	let dispatch
	const emitter = new Emitter({
		on(next) {
			onCalls++
			dispatch = next
			return () => {}
		},
		initialValue: () => 'base',
	})

	root(dispose => {
		const a = emitter.use()
		const b = emitter.use()

		// one native subscription, both accessors see it
		expect(onCalls).toBe(1)

		dispatch('next')
		expect(a()).toBe('next')
		expect(b()).toBe(a())

		dispose()
	})
})

// --- initialValue is a plain value, not a function ---------------------

await test('emitter - initialValue can be a plain non-function value', expect => {
	const emitter = new Emitter({
		on() {
			return () => {}
		},
		initialValue: 'direct',
	})

	root(dispose => {
		const value = emitter.use()
		expect(value()).toBe('direct')
		dispose()
	})
})

// --- disposing a subscriber does not affect another active subscriber --

await test('emitter - disposing one owner does not break the other owner', expect => {
	let dispatch
	let offCalls = 0
	const emitter = new Emitter({
		on(next) {
			dispatch = next
			return () => {
				offCalls++
			}
		},
		initialValue: () => 0,
	})

	let disposeFirst
	let disposeSecond
	let firstValue
	let secondValue

	root(d => {
		disposeFirst = d
		firstValue = emitter.use()
	})
	root(d => {
		disposeSecond = d
		secondValue = emitter.use()
	})

	// still one native subscription, both active
	expect(offCalls).toBe(0)

	disposeFirst()
	// second owner still holds the subscription
	expect(offCalls).toBe(0)

	dispatch(42)
	expect(secondValue()).toBe(42)

	disposeSecond()
	// now everyone is gone
	expect(offCalls).toBe(1)
})

// --- on callback runs inside the owner, cleaned up on dispose ---------

await test('emitter - `on` listener stops firing after the owner disposes', async expect => {
	let dispatch
	const seen = []

	const emitter = new Emitter({
		on(next) {
			dispatch = next
			return () => {}
		},
		initialValue: () => 'start',
	})

	let disposeOwner
	root(d => {
		disposeOwner = d
		emitter.on(value => seen.push(value))
	})

	dispatch('a')
	await microtask()

	disposeOwner()

	dispatch('b')
	await microtask()

	// only 'a' is observed; 'b' is after dispose
	expect(seen.includes('a')).toBe(true)
	expect(seen.includes('b')).toBe(false)
})
