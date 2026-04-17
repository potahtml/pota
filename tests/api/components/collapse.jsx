/** @jsxImportSource pota */

// Tests for the Collapse component: the wrapper toggles display
// between contents/none, children stay mounted across toggles,
// fallback mounts as a sibling only when hidden.
import { $, test, body } from '#test'

import { render, signal } from 'pota'
import { Collapse } from 'pota/components'

await test('Collapse - renders a display:contents div wrapper when visible', expect => {
	const dispose = render(<Collapse when={true}>visible</Collapse>)

	const wrapper = /** @type {HTMLDivElement} */ (
		document.body.firstElementChild
	)
	expect(wrapper.tagName).toBe('DIV')
	expect(wrapper.style.display).toBe('contents')
	expect(wrapper.textContent).toBe('visible')

	dispose()
})

await test('Collapse - hides the wrapper but keeps light DOM children mounted when false', expect => {
	const dispose = render(
		<Collapse when={false}>
			<p id="kept">kept</p>
		</Collapse>,
	)

	const wrapper = /** @type {HTMLDivElement} */ (
		document.body.firstElementChild
	)
	expect(wrapper.style.display).toBe('none')
	expect(document.getElementById('kept')).not.toBe(null)
	expect(wrapper.innerHTML).toBe('<p id="kept">kept</p>')

	dispose()
})

await test('Collapse - shows fallback content when false and children when true', expect => {
	const dispose1 = render(
		<Collapse when={true} fallback={<p>fallback</p>}>
			<p>content</p>
		</Collapse>,
	)

	const wrapper1 = /** @type {HTMLDivElement} */ (
		document.body.firstElementChild
	)
	expect(wrapper1.style.display).toBe('contents')
	expect(wrapper1.innerHTML).toBe('<p>content</p>')
	expect(body().includes('fallback')).toBe(false)

	dispose1()

	const dispose2 = render(
		<Collapse when={false} fallback={<p>fallback</p>}>
			<p>content</p>
		</Collapse>,
	)

	const wrapper2 = /** @type {HTMLDivElement} */ (
		document.body.firstElementChild
	)
	expect(wrapper2.style.display).toBe('none')
	expect(wrapper2.innerHTML).toBe('<p>content</p>')
	expect(body().includes('<p>fallback</p>')).toBe(true)

	dispose2()
})

await test('Collapse - treats falsy and truthy values as visibility switches', expect => {
	const dispose1 = render(<Collapse when={0}>content</Collapse>)
	expect(
		/** @type {HTMLDivElement} */ (document.body.firstElementChild)
			.style.display,
	).toBe('none')
	dispose1()

	const dispose2 = render(<Collapse when="yes">content</Collapse>)
	expect(
		/** @type {HTMLDivElement} */ (document.body.firstElementChild)
			.style.display,
	).toBe('contents')
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
	const wrapper = /** @type {HTMLDivElement} */ (
		document.body.firstElementChild
	)

	when.write(false)
	expect(wrapper.style.display).toBe('none')
	expect(document.getElementById('node')).toBe(node)

	when.write(true)
	expect(wrapper.style.display).toBe('contents')
	expect(document.getElementById('node')).toBe(node)

	dispose()
})

await test('Collapse - switches between fallback and children reactively', expect => {
	const when = signal(false)

	const dispose = render(
		<Collapse when={when.read} fallback="loading">
			done
		</Collapse>,
	)

	const wrapper = /** @type {HTMLDivElement} */ (
		document.body.firstElementChild
	)

	expect(wrapper.style.display).toBe('none')
	expect(body().includes('loading')).toBe(true)

	when.write(true)
	expect(wrapper.style.display).toBe('contents')
	expect(body().includes('loading')).toBe(false)

	when.write(false)
	expect(wrapper.style.display).toBe('none')
	expect(body().includes('loading')).toBe(true)

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

	const wrapper = /** @type {HTMLDivElement} */ (
		document.body.firstElementChild
	)

	expect(wrapper.style.display).toBe('contents')
	expect($('p').textContent).toBe('original')

	// collapse, then update text while hidden
	when.write(false)
	expect(wrapper.style.display).toBe('none')

	text.write('updated')

	// show again — children should have updated content
	when.write(true)
	expect(wrapper.style.display).toBe('contents')
	expect($('p').textContent).toBe('updated')

	dispose()
})

// --- null and undefined treated as falsy --------------------------------

await test('Collapse - when=null is treated as hidden', expect => {
	const dispose = render(<Collapse when={null}>content</Collapse>)
	expect(
		/** @type {HTMLDivElement} */ (document.body.firstElementChild)
			.style.display,
	).toBe('none')
	dispose()
})

await test('Collapse - when=undefined is treated as hidden', expect => {
	const dispose = render(
		<Collapse when={undefined}>content</Collapse>,
	)
	expect(
		/** @type {HTMLDivElement} */ (document.body.firstElementChild)
			.style.display,
	).toBe('none')
	dispose()
})

// --- multiple rapid toggles --------------------------------------------

await test('Collapse - multiple rapid toggles settle on the final value', expect => {
	const when = signal(true)
	const dispose = render(
		<Collapse when={when.read}>content</Collapse>,
	)

	const wrapper = /** @type {HTMLDivElement} */ (
		document.body.firstElementChild
	)

	when.write(false)
	when.write(true)
	when.write(false)
	when.write(true)
	when.write(false)

	expect(wrapper.style.display).toBe('none')

	when.write(true)
	expect(wrapper.style.display).toBe('contents')

	dispose()
})

// --- empty children still render the wrapper ---------------------------

await test('Collapse - with no children still renders the wrapper when visible', expect => {
	const dispose = render(<Collapse when={true}></Collapse>)

	const wrapper = /** @type {HTMLDivElement} */ (
		document.body.firstElementChild
	)
	expect(wrapper).not.toBe(null)
	expect(wrapper.tagName).toBe('DIV')
	expect(wrapper.style.display).toBe('contents')

	dispose()
})

// --- dispose cleans up the wrapper element -----------------------------

await test('Collapse - dispose removes the wrapper element', expect => {
	const dispose = render(<Collapse when={true}>content</Collapse>)

	expect(document.body.firstElementChild).not.toBe(null)

	dispose()

	expect(document.body.firstElementChild).toBe(null)
})

await test('Collapse - hides output but preserves uncontrolled input state across visibility toggles', expect => {
	const visible = signal(true)

	const dispose = render(
		<Collapse when={visible.read}>
			<input id="field" value="start" />
		</Collapse>,
	)

	const input = /** @type {HTMLInputElement} */ (
		document.getElementById('field')
	)
	input.value = 'typed'

	const wrapper = /** @type {HTMLDivElement} */ (
		document.body.firstElementChild
	)

	// showing
	expect(wrapper.style.display).toBe('contents')

	visible.write(false)

	// hidden
	expect(wrapper.style.display).toBe('none')

	expect(document.getElementById('field')).toBe(input)
	expect(input.value).toBe('typed')

	visible.write(true)

	expect(wrapper.style.display).toBe('contents')
	expect(document.getElementById('field')).toBe(input)
	expect(
		/** @type {HTMLInputElement} */ (document.getElementById('field'))
			.value,
	).toBe('typed')

	dispose()
})
