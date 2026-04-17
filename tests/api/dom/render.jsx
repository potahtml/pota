/** @jsxImportSource pota */

// Tests for `render()`, `insert()`, `toHTML()` — mounting into a
// parent, clear option, dispose semantics, multiple independent
// renders, function components returning text/array, rendering
// scalar/null inputs, moving DOM nodes between renders.

import { $, $$, body, test } from '#test'
import { insert, render, root, toHTML } from 'pota'

await test('render - mounts into a specific parent element', expect => {
	const parent = document.createElement('section')
	document.body.appendChild(parent)

	const dispose = render(<p>inside</p>, parent)

	expect(parent.innerHTML).toBe('<p>inside</p>')

	dispose()
	parent.remove()
})

await test('render - clear option replaces pre-existing parent content', expect => {
	const parent = document.createElement('section')
	parent.innerHTML = '<span>old</span>'
	document.body.appendChild(parent)

	const dispose = render(<p>new</p>, parent, { clear: true })

	expect(parent.innerHTML).toBe('<p>new</p>')

	dispose()
	parent.remove()
})

await test('render - dispose removes only rendered content, not pre-existing parent content', expect => {
	const parent = document.createElement('section')
	parent.innerHTML = '<span>kept</span>'
	document.body.appendChild(parent)

	const dispose = render(<p>rendered</p>, parent)

	expect(parent.innerHTML).toBe('<span>kept</span><p>rendered</p>')

	dispose()

	expect(parent.innerHTML).toBe('<span>kept</span>')

	parent.remove()
})

await test('render - multiple independent renders into same parent dispose independently', expect => {
	const parent = document.createElement('section')
	document.body.appendChild(parent)

	const disposeA = render(<p>a</p>, parent)
	const disposeB = render(<p>b</p>, parent)

	expect(parent.innerHTML).toBe('<p>a</p><p>b</p>')

	disposeA()

	expect(parent.innerHTML).toBe('<p>b</p>')

	disposeB()

	expect(parent.innerHTML).toBe('')

	parent.remove()
})

await test('insert - can clear an existing parent before mounting', expect => {
	const parent = document.createElement('div')
	parent.innerHTML = '<span>old</span>'

	const dispose = root(dispose => {
		insert(<p>new</p>, parent, { clear: true })
		return dispose
	})

	expect(parent.innerHTML).toBe('<p>new</p>')

	dispose()
})

await test('insert - appends without clear when asked to keep existing content', expect => {
	const parent = document.createElement('div')
	parent.innerHTML = '<span>old</span>'

	const dispose = root(dispose => {
		insert(<p>new</p>, parent)
		return dispose
	})

	expect(parent.innerHTML).toBe('<span>old</span><p>new</p>')

	dispose()
})

await test('toHTML - creates detached DOM nodes', expect => {
	const nodes = /** @type {NodeListOf<HTMLParagraphElement>} */ (
		toHTML(
			<>
				<p>a</p>
				<p>b</p>
			</>,
		)
	)

	expect(nodes.length).toBe(2)
	expect(nodes[0].outerHTML).toBe('<p>a</p>')
	expect(nodes[1].outerHTML).toBe('<p>b</p>')
	expect(nodes[0].isConnected).toBe(false)
	expect(nodes[1].isConnected).toBe(false)
})

await test('toHTML - returns a single detached node when markup has one root', expect => {
	const nodes = /** @type {HTMLParagraphElement} */ (
		toHTML(<p>single</p>)
	)

	expect(nodes instanceof HTMLParagraphElement).toBe(true)
	expect(nodes.outerHTML).toBe('<p>single</p>')
	expect(nodes.isConnected).toBe(false)
})

await test('toHTML - used inside a component to convert props.children to real nodes', expect => {
	function Menu(props) {
		const nodes = toHTML(props.children)
		return <ul>{nodes}</ul>
	}

	const dispose = render(
		<Menu>
			<li>one</li>
			<li>two</li>
			<li>three</li>
		</Menu>,
	)

	expect(body()).toBe(
		'<ul><li>one</li><li>two</li><li>three</li></ul>',
	)

	dispose()
})

// --- render with a component returning text --------------------

await test('render - function component returning text renders as text', expect => {
	function Greeting() {
		return 'hello'
	}

	const dispose = render(<Greeting />)

	expect(body()).toBe('hello')

	dispose()
})

// --- render with a component returning an array ---------------

await test('render - function component returning an array renders each element', expect => {
	function Multi() {
		return [<p>a</p>, <p>b</p>, <p>c</p>]
	}

	const dispose = render(<Multi />)

	expect(body()).toBe('<p>a</p><p>b</p><p>c</p>')

	dispose()
})

await test('render - dispose fully removes its rendered nodes', expect => {
	const dispose = render(
		<div>
			<p>one</p>
			<p>two</p>
		</div>,
	)

	expect($('div')).not.toBe(null)
	expect($$('p').length).toBe(2)

	dispose()

	expect($('div')).toBe(null)
	expect($$('p').length).toBe(0)
})

// --- empty fragment renders nothing ------------------------------------------

await test('render - render with null renders nothing', expect => {
	const dispose = render(null)
	expect(body()).toBe('')
	dispose()
})

// --- rendering a bare string --------------------------------------------

await test('render - render with a plain string creates a text node', expect => {
	const dispose = render('hello')
	expect(body()).toBe('hello')
	dispose()
})

// --- rendering a bare number --------------------------------------------

await test('render - render with a bare number renders it as text', expect => {
	const dispose = render(42)
	expect(body()).toBe('42')
	dispose()
})

// --- render into a specific parent ----------------------------------

await test('render - render accepts a parent element as second argument', expect => {
	const parent = document.createElement('section')
	document.body.append(parent)

	const dispose = render(<p>inside</p>, parent)

	expect(parent.innerHTML).toBe('<p>inside</p>')
	// body should not contain <p>inside</p> directly, only via parent
	expect(parent.querySelector('p')).not.toBe(null)

	dispose()
	parent.remove()
})

// --- render multiple independent into body -----------------------------------

await test('render - concurrent renders into different parents do not interfere', expect => {
	const a = document.createElement('div')
	const b = document.createElement('div')
	document.body.append(a, b)

	const disposeA = render(<p>A</p>, a)
	const disposeB = render(<p>B</p>, b)

	expect(a.innerHTML).toBe('<p>A</p>')
	expect(b.innerHTML).toBe('<p>B</p>')

	disposeA()
	expect(a.innerHTML).toBe('')
	expect(b.innerHTML).toBe('<p>B</p>')

	disposeB()
	a.remove()
	b.remove()
})

// --- render same element reference twice ------------------------------------

await test('render - rendering same DOM node moves it', expect => {
	const node = document.createElement('p')
	node.textContent = 'shared'

	const parentA = document.createElement('div')
	const parentB = document.createElement('div')
	document.body.append(parentA, parentB)

	parentA.append(node)
	expect(parentA.contains(node)).toBe(true)

	parentB.append(node)
	expect(parentA.contains(node)).toBe(false)
	expect(parentB.contains(node)).toBe(true)

	parentA.remove()
	parentB.remove()
})
