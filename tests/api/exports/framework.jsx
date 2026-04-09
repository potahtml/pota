/** @jsxImportSource pota */

// Integration scenarios testing the renderer as a whole: reactive
// children switching types, effect disposal on unmount, keyed list
// reordering, reactive event handlers, Dynamic, Portal, use:connected,
// and use:disconnected.
import { $, $$, body, microtask, test } from '#test'

import { cleanup, effect, render, signal } from 'pota'
import { Dynamic, For, Portal, Show } from 'pota/components'

await test('framework - reactive children can switch between text, arrays, elements and empty without corrupting sibling order', expect => {
	const mode = signal('text')
	const dispose = render(
		<div>
			<span>before</span>
			{() =>
				mode.read() === 'text' ? (
					'middle'
				) : mode.read() === 'array' ? (
					[<b>bold</b>, <i>italic</i>]
				) : mode.read() === 'element' ? (
					<u>under</u>
				) : null
			}
			<span>after</span>
		</div>,
	)

	expect(body()).toBe(
		'<div><span>before</span>middle<span>after</span></div>',
	)

	mode.write('array')
	expect(body()).toBe(
		'<div><span>before</span><b>bold</b><i>italic</i><span>after</span></div>',
	)

	mode.write('element')
	expect(body()).toBe(
		'<div><span>before</span><u>under</u><span>after</span></div>',
	)

	mode.write('empty')
	expect(body()).toBe(
		'<div><span>before</span><span>after</span></div>',
	)

	dispose()
})

await test('framework - conditional branches dispose owned effects exactly when unmounted and recreate cleanly', expect => {
	const visible = signal(true)
	const seen = []
	const Child = () => {
		effect(() => {
			seen.push('mount')
			cleanup(() => {
				seen.push('cleanup')
			})
		})
		return <p>child</p>
	}
	const dispose = render(
		<Show when={visible.read}>
			<Child />
		</Show>,
	)

	expect(body()).toBe('<p>child</p>')
	expect(seen).toEqual(['mount'])

	visible.write(false)
	expect(body()).toBe('')
	expect(seen).toEqual(['mount', 'cleanup'])

	visible.write(true)
	expect(body()).toBe('<p>child</p>')
	expect(seen).toEqual(['mount', 'cleanup', 'mount'])

	dispose()
	expect(seen).toEqual(['mount', 'cleanup', 'mount', 'cleanup'])
})

await test('framework - keyed list reordering preserves DOM node identity and uncontrolled input state', expect => {
	const first = { id: 'a', label: 'A' }
	const second = { id: 'b', label: 'B' }
	const items = signal([first, second])
	const dispose = render(
		<For each={items.read}>
			{item => (
				<input
					data-id={item.id}
					value={item.label}
				/>
			)}
		</For>,
	)

	const firstNode = $('[data-id="a"]')
	const secondNode = $('[data-id="b"]')

	firstNode.value = 'typed A'
	secondNode.value = 'typed B'

	items.write([second, first])

	expect($$('input')[0]).toBe(secondNode)
	expect($$('input')[1]).toBe(firstNode)
	expect($('[data-id="a"]').value).toBe('typed A')
	expect($('[data-id="b"]').value).toBe('typed B')

	dispose()
})

await test('framework - event handlers arent reactive', expect => {
	const handler = signal(() => {})
	const calls = []

	handler.write(() => {
		calls.push('first')
	})
	const dispose = render(
		<button on:click={handler.read}>click</button>,
	)

	expect($('button') instanceof HTMLButtonElement).toBe(true)

	$('button').click()
	handler.write(() => {
		calls.push('second')
	})
	$('button').click()

	// on:click={handler.read} just reads the signal on click, it doesnt actually runs the signal value in the event listener
	expect(calls).toEqual([])

	dispose()
})

await test('framework - Portal content is mounted outside the local tree and still cleans up with the owner', expect => {
	const mount = document.createElement('div')
	mount.id = 'portal-mount'
	document.body.appendChild(mount)

	const dispose = render(
		<>
			<p>local</p>
			<Portal mount={mount}>
				<span>ported</span>
			</Portal>
		</>,
	)

	expect(body()).toBe(
		'<div id="portal-mount"><span>ported</span></div><p>local</p>',
	)
	expect($('#portal-mount').innerHTML).toBe('<span>ported</span>')

	dispose()

	expect($('#portal-mount').innerHTML).toBe('')
	$('#portal-mount').remove()
})

await test('framework - use:connected fires after the element is inserted into the DOM', async expect => {
	const seen = []

	const dispose = render(
		<main use:connected={node => seen.push(node.tagName)}>
			content
		</main>,
	)

	expect(seen).toEqual([])

	await microtask()

	expect(seen).toEqual(['MAIN'])

	dispose()
})

await test('framework - use:connected accepts an array of callbacks', async expect => {
	const seen = []

	const dispose = render(
		<p
			use:connected={[
				node => seen.push('a:' + node.tagName),
				node => seen.push('b:' + node.tagName),
			]}
		>
			hi
		</p>,
	)

	expect(seen).toEqual([])

	await microtask()

	expect(seen).toEqual(['a:P', 'b:P'])

	dispose()
})

await test('framework - use:disconnected fires when the element is removed from the DOM', expect => {
	const seen = []

	const dispose = render(
		<main use:disconnected={node => seen.push(node.tagName)}>
			content
		</main>,
	)

	expect(seen).toEqual([])

	dispose()

	expect(seen).toEqual(['MAIN'])
})
