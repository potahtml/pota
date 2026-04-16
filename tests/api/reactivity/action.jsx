// Tests for `action()` — sync and async chained callbacks, including
// rejection routing through catchError.

import { test, macrotask, sleep } from '#test'
import { action, catchError, root } from 'pota'

await test('action - resolves chained sync and async callbacks', async expect => {
	const seen = []
	const run = action(
		value => Promise.resolve(value + 1),
		value => value * 2,
		value => seen.push(value),
	)

	run(2)
	await macrotask()

	expect(seen).toEqual([6])
})

// --- action sync only --------------------------------------------------------

await test('action - resolves a fully synchronous chain', expect => {
	const result = []
	const run = action(
		v => v + 1,
		v => v * 3,
		v => result.push(v),
	)

	run(1)
	expect(result).toEqual([6])
})

// --- action() rejection routing --------------------------------------

await test('action — rejected promise routes to catchError handler', async expect => {
	/** @type {any} */
	let caught
	root(() => {
		catchError(
			() => {
				const fn = action(() =>
					Promise.reject(new Error('action fail')),
				)
				fn()
			},
			err => {
				caught = err
			},
		)
	})

	await sleep(50)
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('action fail')
})

await test('action — rejected promise without handler goes to console.error', async expect => {
	const original = console.error
	/** @type {any} */
	let logged
	console.error = err => {
		logged = err
	}

	root(() => {
		const fn = action(() =>
			Promise.reject(new Error('action unhandled')),
		)
		fn()
	})

	await sleep(50)
	expect(logged instanceof Error).toBe(true)
	expect(logged.message).toBe('action unhandled')
	console.error = original
})

await test('action — rejection in chain stage routes to handler', async expect => {
	/** @type {any} */
	let caught
	root(() => {
		catchError(
			() => {
				const fn = action(
					() => Promise.resolve('ok'),
					() => Promise.reject(new Error('chain fail')),
				)
				fn()
			},
			err => {
				caught = err
			},
		)
	})

	await sleep(50)
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('chain fail')
})
