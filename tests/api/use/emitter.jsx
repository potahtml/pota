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
