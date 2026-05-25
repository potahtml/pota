/** @jsxImportSource pota */
// Tests for pota/use/intersection: useVisible/onVisible Emitter pair,
// `visible` ref factory, and `lazyImage` one-shot loader.

import { microtask, test } from '#test'

import { render, root } from 'pota'
import {
	lazyImage,
	onVisible,
	useVisible,
	visible,
} from 'pota/use/intersection'

// IntersectionObserver always fires once with the initial entry when
// observing starts — these tests rely on that initial dispatch.

const waitForObserver = () =>
	new Promise(r =>
		requestAnimationFrame(() => requestAnimationFrame(r)),
	)

await test('intersection - useVisible returns a signal accessor', async expect => {
	const node = document.createElement('div')
	document.body.appendChild(node)

	await root(async dispose => {
		const entry = useVisible(node)
		expect(typeof entry).toBe('function')

		await waitForObserver()

		const value = entry()
		expect(value === undefined || 'isIntersecting' in value).toBe(
			true,
		)

		dispose()
	})

	node.remove()
})

await test('intersection - onVisible fires for each intersection update', async expect => {
	const node = document.createElement('div')
	document.body.appendChild(node)

	const seen = []
	await root(async dispose => {
		onVisible(node, entry => seen.push(entry))

		await waitForObserver()
		await microtask()

		expect(seen.length >= 1).toBe(true)
		expect('isIntersecting' in seen[seen.length - 1]).toBe(true)

		dispose()
	})

	node.remove()
})

await test('intersection - visible ref factory wires onVisible', async expect => {
	const seen = []

	const dispose = render(
		<div use:ref={visible(entry => seen.push(entry))}>tracked</div>,
		document.body,
	)

	await microtask()
	await waitForObserver()
	await microtask()

	expect(seen.length >= 1).toBe(true)

	dispose()
})

await test('intersection - lazyImage swaps src when element enters view', async expect => {
	const dispose = render(
		<img
			data-src="data:image/svg+xml,%3Csvg/%3E"
			use:ref={lazyImage()}
		/>,
		document.body,
	)

	await microtask()
	await waitForObserver()
	await microtask()

	const img = /** @type {HTMLImageElement} */ (
		document.querySelector('img')
	)
	expect(img.src.startsWith('data:image/svg+xml')).toBe(true)

	dispose()
})

await test('intersection - multiple useVisible on the same node share one observer', async expect => {
	const node = document.createElement('div')
	document.body.appendChild(node)

	await root(async dispose => {
		const a = useVisible(node)
		const b = useVisible(node)
		const c = useVisible(node)

		await waitForObserver()

		// all three observe the same entry
		expect(a()).toBe(b())
		expect(b()).toBe(c())

		dispose()
	})

	node.remove()
})
