/** @jsxImportSource pota */

// Tests for promise rejection routing through error boundaries.
//
// `withValue` chains `.then(onFulfilled, onRejected)` — rejected
// promises inside a catchError/Errored scope route to the error
// handler via `owned` → `runWithOwner` → `routeError`.

import { $, test, body, microtask, sleep } from '#test'
import {
	action,
	render,
	signal,
	effect,
	catchError,
	derived,
	root,
	batch,
} from 'pota'
import { Errored } from 'pota/components'

// --- catchError level ------------------------------------------------

await test('catchError — catches rejected promise in derived', async expect => {
	/** @type {any} */
	let caught
	root(() => {
		catchError(
			() => {
				const d = derived(
					() => Promise.reject(new Error('rejected')),
				)
				d()
			},
			err => {
				caught = err
			},
		)
	})

	await sleep(50)
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('rejected')
})

await test('catchError — catches non-Error rejected value', async expect => {
	/** @type {any} */
	let caught
	root(() => {
		catchError(
			() => {
				const d = derived(() => Promise.reject('plain string'))
				d()
			},
			err => {
				caught = err
			},
		)
	})

	await sleep(50)
	expect(caught).toBe('plain string')
})

await test('catchError — catches rejected promise via signal change', async expect => {
	/** @type {any} */
	let caught
	const [read, write] = signal(false)
	root(() => {
		catchError(
			() => {
				const d = derived(() =>
					read()
						? Promise.reject(new Error('later'))
						: 'ok',
				)
				d()
			},
			err => {
				caught = err
			},
		)
	})

	await sleep(50)
	expect(caught).toBe(undefined) // no rejection yet

	write(true) // now derived returns a rejecting promise
	await sleep(50)
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('later')
})

await test('catchError — rejection does not break sibling effects', async expect => {
	/** @type {any} */
	let caught
	const seen = []
	const [read, write] = signal(0)

	root(() => {
		catchError(
			() => {
				const d = derived(
					() => Promise.reject(new Error('boom')),
				)
				d()
			},
			err => {
				caught = err
			},
		)
		// sibling effect
		effect(() => {
			seen.push(read())
		})
	})

	await sleep(50)
	expect(caught.message).toBe('boom')
	expect(seen).toEqual([0])

	write(1)
	expect(seen).toEqual([0, 1])
})

await test('catchError — rejection without handler goes to console.error', async expect => {
	const original = console.error
	/** @type {any} */
	let logged
	console.error = err => {
		logged = err
	}

	root(() => {
		const d = derived(
			() => Promise.reject(new Error('no handler')),
		)
		d()
	})

	await sleep(50)
	expect(logged instanceof Error).toBe(true)
	expect(logged.message).toBe('no handler')
	console.error = original
})

// --- action / resolve rejection --------------------------------------

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

// --- Errored component level -----------------------------------------

await test('Errored — catches rejected promise and shows fallback', async expect => {
	const originalError = console.error
	console.error = () => {}

	const Async = () => {
		const d = derived(
			() => Promise.reject(new Error('async fail')),
		)
		return <p>{d}</p>
	}

	const dispose = render(
		<Errored fallback={err => <p>{err.message}</p>}>
			<Async />
		</Errored>,
	)

	await sleep(50)
	expect(body()).toBe('<p>async fail</p>')

	console.error = originalError
	dispose()
})

await test('Errored — rejected promise does not break parent', async expect => {
	const originalError = console.error
	console.error = () => {}

	const [count, setCount] = signal(0)

	const Async = () => {
		const d = derived(
			() => Promise.reject(new Error('fail')),
		)
		return <p>{d}</p>
	}

	const dispose = render(
		<div>
			<p id="parent">{count}</p>
			<Errored fallback={<p>caught</p>}>
				<Async />
			</Errored>
		</div>,
	)

	await sleep(50)
	expect(body()).toBe(
		'<div><p id="parent">0</p><p>caught</p></div>',
	)

	// parent still updates
	setCount(1)
	expect($('#parent').textContent).toBe('1')

	console.error = originalError
	dispose()
})

await test('Errored — promise that resolves then rejects on signal change', async expect => {
	const originalError = console.error
	console.error = () => {}

	const [shouldFail, setShouldFail] = signal(false)

	const Async = () => {
		const d = derived(() =>
			shouldFail()
				? Promise.reject(new Error('failed'))
				: Promise.resolve('ok'),
		)
		return <p>{d}</p>
	}

	const dispose = render(
		<Errored fallback={err => <p>{err.message}</p>}>
			<Async />
		</Errored>,
	)

	await sleep(50)
	expect(body()).toBe('<p>ok</p>')

	setShouldFail(true)
	await sleep(50)
	expect(body()).toBe('<p>failed</p>')

	console.error = originalError
	dispose()
})
