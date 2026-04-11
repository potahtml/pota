/** @jsxImportSource pota */

// Tests for the Collapse component: visibility slot rendering, signal
// toggling, fallback slot, reactive children while collapsed, and
// cleanup.
import { $, test, body } from '#test'

import { render, signal } from 'pota'
import { Collapse } from 'pota/components'

await test('Collapse - renders through a pota-collapse element and shows a slot when visible', expect => {
	const dispose = render(<Collapse when={true}>visible</Collapse>)

	expect($('pota-collapse')).not.toBe(null)
	expect($('pota-collapse').shadowRoot.innerHTML).toBe(
		'<slot></slot>',
	)

	dispose()
})

await test('Collapse - hides the slot but keeps light DOM children mounted when false', expect => {
	const dispose = render(
		<Collapse when={false}>
			<p id="kept">kept</p>
		</Collapse>,
	)

	expect($('pota-collapse').shadowRoot.innerHTML).toBe('')
	expect(document.getElementById('kept')).not.toBe(null)
	expect(body()).toBe(
		'<pota-collapse><p id="kept">kept</p></pota-collapse>',
	)

	dispose()
})

await test('Collapse - shows fallback content when false and children when true', expect => {
	const dispose1 = render(
		<Collapse
			when={true}
			fallback={<p>fallback</p>}
		>
			<p>content</p>
		</Collapse>,
	)

	expect(body()).toBe('<pota-collapse><p>content</p></pota-collapse>')
	dispose1()

	const dispose2 = render(
		<Collapse
			when={false}
			fallback={<p>fallback</p>}
		>
			<p>content</p>
		</Collapse>,
	)

	expect(body()).toBe('<pota-collapse><p>content</p></pota-collapse>')
	expect($('pota-collapse').shadowRoot.innerHTML).toBe('')

	dispose2()
})

await test('Collapse - treats falsy and truthy values as visibility switches', expect => {
	const dispose1 = render(<Collapse when={0}>content</Collapse>)
	expect($('pota-collapse').shadowRoot.innerHTML).toBe('')
	dispose1()

	const dispose2 = render(<Collapse when="yes">content</Collapse>)
	expect($('pota-collapse').shadowRoot.innerHTML).toBe(
		'<slot></slot>',
	)
	dispose2()
})

await test('Collapse - toggles reactively without recreating the child node', expect => {
	const when = signal(true)
	const dispose = render(
		<Collapse when={when.read}>
			<p id="node">content</p>
		</Collapse>,
	)

	const node = document.getElementById('node')

	when.write(false)

	expect($('pota-collapse').shadowRoot.innerHTML).toBe('')

	expect(document.getElementById('node')).toBe(node)

	when.write(true)

	expect($('pota-collapse').shadowRoot.innerHTML).toBe(
		'<slot></slot>',
	)

	expect(document.getElementById('node')).toBe(node)

	dispose()
})

await test('Collapse - switches between fallback and children reactively', expect => {
	const when = signal(false)

	const dispose = render(
		<Collapse
			when={when.read}
			fallback="loading"
		>
			done
		</Collapse>,
	)

	const collapse = $('pota-collapse')

	expect(collapse.shadowRoot.innerHTML).toBe('loading')

	when.write(true)

	expect(collapse.shadowRoot.innerHTML).toBe('<slot></slot>')

	when.write(false)

	expect(collapse.shadowRoot.innerHTML).toBe('loading')

	dispose()
})

await test('Collapse - reactive children update while collapsed and reflect when shown', expect => {
	const when = signal(true)
	const text = signal('original')

	const dispose = render(
		<Collapse when={when.read}>
			<p>{text.read}</p>
		</Collapse>,
	)

	const collapse = document.querySelector('pota-collapse')

	expect(collapse.shadowRoot.innerHTML).toBe('<slot></slot>')
	expect(document.querySelector('p').textContent).toBe(
		'original',
	)

	// collapse, then update text while hidden
	when.write(false)
	expect(collapse.shadowRoot.innerHTML).toBe('')

	text.write('updated')

	// show again — children should have updated content
	when.write(true)
	expect(collapse.shadowRoot.innerHTML).toBe('<slot></slot>')
	expect(document.querySelector('p').textContent).toBe(
		'updated',
	)

	dispose()
})

// --- null and undefined treated as falsy --------------------------------

await test('Collapse - when=null is treated as hidden', expect => {
	const dispose = render(<Collapse when={null}>content</Collapse>)
	expect($('pota-collapse').shadowRoot.innerHTML).toBe('')
	dispose()
})

await test('Collapse - when=undefined is treated as hidden', expect => {
	const dispose = render(<Collapse when={undefined}>content</Collapse>)
	expect($('pota-collapse').shadowRoot.innerHTML).toBe('')
	dispose()
})

// --- multiple rapid toggles --------------------------------------------

await test('Collapse - multiple rapid toggles settle on the final value', expect => {
	const when = signal(true)
	const dispose = render(
		<Collapse when={when.read}>content</Collapse>,
	)

	const collapse = $('pota-collapse')

	when.write(false)
	when.write(true)
	when.write(false)
	when.write(true)
	when.write(false)

	expect(collapse.shadowRoot.innerHTML).toBe('')

	when.write(true)
	expect(collapse.shadowRoot.innerHTML).toBe('<slot></slot>')

	dispose()
})

// --- empty children render an empty slot --------------------------------

await test('Collapse - with no children still renders the wrapper when visible', expect => {
	const dispose = render(<Collapse when={true}></Collapse>)

	expect($('pota-collapse')).not.toBe(null)
	expect($('pota-collapse').shadowRoot.innerHTML).toBe('<slot></slot>')

	dispose()
})

// --- dispose cleans up the wrapper element -----------------------------

await test('Collapse - dispose removes the wrapper element', expect => {
	const dispose = render(<Collapse when={true}>content</Collapse>)

	expect($('pota-collapse')).not.toBe(null)

	dispose()

	expect($('pota-collapse')).toBe(null)
})
