/** @jsxImportSource pota */

// Tests for `ready()` and `readyAsync()` — flush callbacks after
// synchronous and asynchronous mount work.

import { $, macrotask, microtask, test } from '#test'
import { ready, readyAsync, render, root, withValue } from 'pota'

await test('ready and readyAsync - flush after synchronous and async work', async expect => {
	const seen = []

	let dispose
	root(rootDispose => {
		dispose = rootDispose
		ready(() => seen.push('ready'))
		withValue(
			Promise.resolve('done'),
			value => seen.push(value),
			() => seen.push('pending'),
		)
		readyAsync(() => seen.push('readyAsync'))
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
