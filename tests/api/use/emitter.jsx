/** @jsxImportSource pota */

import { test } from '#test'

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

await test('emitter - on receives initial and subsequent values inside an owner', expect => {
	let dispatch
	const seen = []

	const emitter = new Emitter({
		on(next) {
			dispatch = next
			return () => {}
		},
		initialValue: () => 'first',
	})

	root(dispose => {
		emitter.on(value => {
			seen.push(value)
		})

		dispatch('second')
		dispatch('third')
		dispose()
	})

	expect(seen).toEqual(['first', 'second', 'third'])
})
