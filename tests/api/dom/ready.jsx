/** @jsxImportSource pota */

// Tests for `ready()` and `readyAsync()` — flush callbacks after
// synchronous and asynchronous mount work.

import { $, macrotask, microtask, test } from '#test'
import { ready, readyAsync, render, root, withValue } from 'pota'

await test('ready and readyAsync - flush after synchronous and async work', async expect => {
	const seen = []

	const dispose = root(d => {
		ready(() => seen.push('ready'))
		withValue(
			Promise.resolve('done'),
			value => seen.push(value),
			() => seen.push('pending'),
		)
		readyAsync(() => seen.push('readyAsync'))
		return d
	})

	expect(seen).toEqual(['pending'])

	await macrotask()

	expect(seen).toEqual(['pending', 'ready', 'done', 'readyAsync'])

	dispose()
})

await test('ready - inside a component fires after component mounts', async expect => {
	const seen = []

	function Widget() {
		ready(() => seen.push('mounted'))
		return <p>widget</p>
	}

	expect(seen).toEqual([])

	const dispose = render(Widget)

	expect(seen).toEqual([])

	await microtask()

	expect(seen).toEqual(['mounted'])

	dispose()
})

await test('readyAsync - fires after microtask when no async work is pending', async expect => {
	const seen = []

	const dispose = root(d => {
		readyAsync(() => seen.push('fired'))
		return d
	})

	expect(seen).toEqual([])

	await macrotask()

	expect(seen).toEqual(['fired'])

	dispose()
})

await test('readyAsync - batches multiple callbacks into one flush', async expect => {
	const seen = []

	const dispose = root(d => {
		readyAsync(() => seen.push('a'))
		readyAsync(() => seen.push('b'))
		readyAsync(() => seen.push('c'))
		return d
	})

	expect(seen).toEqual([])

	await macrotask()

	// All three callbacks fire in registration order on the same
	// flush — `fns.slice()` in `asyncTracking.run` captures them
	// together.
	expect(seen).toEqual(['a', 'b', 'c'])

	dispose()
})

await test('readyAsync - does not fire after owner is disposed', async expect => {
	const seen = []

	const dispose = root(rootDispose => {
		readyAsync(() => seen.push('fired'))
		return rootDispose
	})

	// Dispose synchronously, before the double-microtask flush runs.
	// `owned(fn)` wraps the callback, and the owner's cleanup marks
	// it cancelled, so the flush later calls a no-op wrapper.
	dispose()

	await macrotask()

	expect(seen).toEqual([])
})

await test('readyAsync - waits for async work added during promise resolution', async expect => {
	const seen = []

	/** @type {(value: unknown) => void} */
	let resolveOuter = () => {}
	const outer = new Promise(r => {
		resolveOuter = r
	})
	const inner = Promise.resolve('inner-done')

	const dispose = root(d => {
		withValue(
			outer,
			value => seen.push(value),
			() => seen.push('outer-pending'),
		)
		readyAsync(() => seen.push('readyAsync'))
		return d
	})

	expect(seen).toEqual(['outer-pending'])

	// Resolving `outer` with a function means `withValue` creates an
	// effect, calls the function to obtain `inner`, and begins
	// tracking it as new async work — asyncTracking.count briefly
	// drops to 0 then rises to 1 before the first scheduled flush
	// runs, so the flush sees count !== 0 and skips. Only after
	// `inner` resolves does the final flush fire.
	resolveOuter(() => inner)

	await macrotask()

	expect(seen).toEqual(['outer-pending', 'inner-done', 'readyAsync'])

	dispose()
})
