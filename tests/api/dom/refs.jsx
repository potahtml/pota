/** @jsxImportSource pota */

// Tests for `use:ref`, `use:connected`, and `use:disconnected` —
// element-lifecycle hooks. `use:ref` is synchronous (assigned at
// element creation); `use:connected`/`use:disconnected` fire on the
// next microtask after the element joins or leaves the DOM.

import { $, body, microtask, test } from '#test'
import { ready, ref, render } from 'pota'

await test('use:ref - assigns the DOM element to the ref signal on mount', expect => {
	const buttonRef = ref()

	expect(buttonRef()).toBe(undefined)

	const dispose = render(
		<button use:ref={buttonRef}>click me</button>,
	)

	expect(buttonRef() instanceof HTMLButtonElement).toBe(true)
	expect(buttonRef().textContent).toBe('click me')

	dispose()
})

await test('use:ref - accepts multiple refs as an array', expect => {
	const refA = ref()
	const refB = ref()

	const dispose = render(<p use:ref={[refA, refB]}>content</p>)

	expect(refA() instanceof HTMLParagraphElement).toBe(true)
	expect(refB()).toBe(refA())

	dispose()
})

// --- use:ref assigning multiple writes in sequence -------------------

await test('use:ref - reassigning the same signal ref during the same render', expect => {
	const firstRef = ref()
	const secondRef = ref()

	const dispose = render(
		<>
			<p id="a" use:ref={firstRef} />
			<p id="b" use:ref={secondRef} />
		</>,
	)

	expect(firstRef().id).toBe('a')
	expect(secondRef().id).toBe('b')

	dispose()
})

await test('use:ref - is sync; use:connected and ready wait for the next microtask', async expect => {
	const seen = []

	function Widget() {
		ready(() => {
			seen.push('ready:' + $('p')?.textContent)
		})

		return (
			<p
				use:ref={node => seen.push('ref:' + node.textContent)}
				use:connected={node =>
					seen.push('connected:' + node.textContent)
				}
			>
				hello
			</p>
		)
	}

	const dispose = render(<Widget />)

	expect(body()).toBe('<p>hello</p>')
	expect(seen).toEqual(['ref:hello'])

	await microtask()

	expect(seen).toEqual([
		'ref:hello',
		'connected:hello',
		'ready:hello',
	])

	dispose()
})

await test('use:ref - callback receives the real DOM element on the same tick as render', expect => {
	/** @type {any} */
	let captured = null

	const dispose = render(
		<p use:ref={node => (captured = node)}>hi</p>,
	)

	// the element exists and is the one in the document
	expect(captured).toBe($('p'))
	expect(captured.textContent).toBe('hi')

	dispose()
})

await test('use:connected - fires after the element is inserted into the DOM', async expect => {
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

await test('use:connected - accepts an array of callbacks', async expect => {
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

await test('use:disconnected - fires when the element is removed from the DOM', expect => {
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
