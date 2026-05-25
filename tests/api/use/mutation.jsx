/** @jsxImportSource pota */
// Tests for pota/use/mutation: useMutations/onMutations Emitter pair
// and the `mutated` ref factory.

import { microtask, test } from '#test'

import { render, root } from 'pota'
import { mutated, onMutations, useMutations } from 'pota/use/mutation'

await test('mutation - useMutations returns a signal accessor', expect => {
	const node = document.createElement('div')
	document.body.appendChild(node)

	root(dispose => {
		const records = useMutations(node)
		expect(typeof records).toBe('function')
		dispose()
	})

	node.remove()
})

await test('mutation - onMutations fires when descendants are added', async expect => {
	const node = document.createElement('div')
	document.body.appendChild(node)

	const seen = []
	await root(async dispose => {
		onMutations(node, records => {
			seen.push(...records)
		})

		// allow the emitter to attach
		await microtask()

		node.appendChild(document.createElement('span'))

		// wait for the MutationObserver batch
		await new Promise(r => queueMicrotask(() => r()))
		await microtask()

		expect(seen.length >= 1).toBe(true)
		expect(seen[0].type).toBe('childList')

		dispose()
	})

	node.remove()
})

await test('mutation - mutated ref factory wires onMutations', async expect => {
	const seen = []

	const dispose = render(
		<div use:ref={mutated(records => seen.push(...records))}>
			<span />
		</div>,
		document.body,
	)

	await microtask()

	const div = document.body.querySelector('div')
	div.appendChild(document.createElement('em'))

	await new Promise(r => queueMicrotask(() => r()))
	await microtask()

	expect(seen.length >= 1).toBe(true)

	dispose()
})

await test('mutation - respects custom init (attributes only)', async expect => {
	const node = document.createElement('div')
	document.body.appendChild(node)

	const seen = []
	await root(async dispose => {
		onMutations(
			node,
			records => {
				seen.push(...records)
			},
			{ attributes: true },
		)

		await microtask()

		// childList mutation should NOT be observed
		node.appendChild(document.createElement('span'))
		await new Promise(r => queueMicrotask(() => r()))
		await microtask()

		const childListCount = seen.filter(
			r => r.type === 'childList',
		).length
		expect(childListCount).toBe(0)

		// attribute mutation SHOULD be observed
		node.setAttribute('data-flag', '1')
		await new Promise(r => queueMicrotask(() => r()))
		await microtask()

		expect(
			seen.filter(r => r.type === 'attributes').length >= 1,
		).toBe(true)

		dispose()
	})

	node.remove()
})
