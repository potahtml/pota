/** @jsxImportSource pota */

// Tests for renderer exports: Component, Pota, insert, render, toHTML,
// ready, readyAsync, addEvent, removeEvent, setAttribute, setProperty,
// setStyle, setClass, setClassList, propsPlugin, propsPluginNS,
// isComponent, markComponent, makeCallback, ref, use:ref.
import { $, body, macrotask, sleep, test } from '#test'

import {
	Component,
	Pota,
	addEvent,
	isComponent,
	insert,
	makeCallback,
	markComponent,
	propsPlugin,
	propsPluginNS,
	ready,
	readyAsync,
	ref,
	removeEvent,
	render,
	root,
	setAttribute,
	setClass,
	setClassList,
	setProperty,
	setStyle,
	signal,
	toHTML,
	withValue,
} from 'pota'

await test('Component - factory instances share default props and each can override independently', expect => {
	const Tag = Component('p', {
		class: 'base',
		children: 'default text',
	})

	const dispose = render(
		<>
			<Tag />
			<Tag>custom text</Tag>
			<Tag class="override" />
		</>,
	)

	expect(body()).toBe(
		'<p class="base">default text</p>' +
			'<p class="base">custom text</p>' +
			'<p class="override">default text</p>',
	)

	dispose()
})

await test('Component and render - wrap strings, functions, existing elements and apply default props', expect => {
	const Paragraph = Component('p')
	const Message = Component(props => <p>{props.children}</p>)
	const node = document.createElement('hr')
	node.setAttribute('data-kind', 'static')
	const Fixed = Component('p', {
		class: 'fixed',
		children: 'third',
	})
	const Rule = Component(node)
	const dispose = render(
		<>
			<Paragraph>first</Paragraph>
			<Message>second</Message>
			<Fixed id="overridden" />
			<Rule />
		</>,
	)

	expect(body()).toBe(
		'<p>first</p><p>second</p><p class="fixed" id="overridden">third</p><hr data-kind="static">',
	)

	dispose()
})

await test('Pota - props class property provides default prop values and merge with JSX props', expect => {
	class Widget extends Pota {
		props = { label: 'default', color: 'blue' }
		render(props) {
			return <p data-color={props.color}>{props.label}</p>
		}
	}

	const disposeA = render(<Widget />)
	expect(body()).toBe('<p data-color="blue">default</p>')
	disposeA()

	const disposeB = render(<Widget label="custom" />)
	expect(body()).toBe('<p data-color="blue">custom</p>')
	disposeB()
})

await test('Component and Pota - support class components and lifecycle hooks', async expect => {
	const seen = []

	class Greeting extends Pota {
		ready() {
			seen.push('ready')
		}
		cleanup() {
			seen.push('cleanup')
		}
		render(props) {
			return <p>{props.message}</p>
		}
	}

	const dispose = render(<Greeting message="hello" />)

	expect(body()).toBe('<p>hello</p>')

	await macrotask()
	expect(seen).toEqual(['ready'])

	dispose()

	expect(seen).toEqual(['ready', 'cleanup'])
})

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
	const nodes = toHTML(
		<>
			<p>a</p>
			<p>b</p>
		</>,
	)

	expect(nodes.length).toBe(2)
	expect(nodes[0].outerHTML).toBe('<p>a</p>')
	expect(nodes[1].outerHTML).toBe('<p>b</p>')
	expect(nodes[0].isConnected).toBe(false)
	expect(nodes[1].isConnected).toBe(false)
})

await test('toHTML - returns a single detached node when markup has one root', expect => {
	const nodes = toHTML(<p>single</p>)

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

	await macrotask()

	expect(seen).toEqual(['mounted'])

	dispose()
})

await test('addEvent and removeEvent - attach, detach and reattach listeners', expect => {
	const button = document.createElement('button')
	const seen = []
	const handler = event => seen.push(event.type)

	const off = addEvent(button, 'click', handler)
	button.click()

	const on = removeEvent(button, 'click', handler)
	button.click()

	on()
	button.click()

	off()
	button.click()

	expect(seen).toEqual(['click', 'click'])
})

await test('setAttribute and setProperty - support raw values and reactive accessors', expect => {
	const node = document.createElement('input')
	const title = signal('hello')
	let dispose

	root(rootDispose => {
		dispose = rootDispose
		setAttribute(node, 'data-title', title.read)
		setProperty(node, 'value', title.read)
	})

	expect(node.getAttribute('data-title')).toBe('hello')
	expect(node.value).toBe('hello')

	title.write('updated')

	expect(node.getAttribute('data-title')).toBe('updated')
	expect(node.value).toBe('updated')

	setAttribute(node, 'disabled', true)
	expect(node.getAttribute('disabled')).toBe('')

	setAttribute(node, 'data-title', false)
	setProperty(node, 'value', null)

	expect(node.hasAttribute('data-title')).toBe(false)
	expect(node.value).toBe('')

	dispose()
})

await test('propsPlugin and propsPluginNS - handle immediate and deferred plugins', async expect => {
	propsPlugin(
		'data-now',
		(node, value) => node.setAttribute('data-now-ran', value),
		false,
	)
	propsPluginNS(
		'qa',
		(node, localName, value) =>
			node.setAttribute(`data-${localName}`, value),
		false,
	)
	propsPluginNS(
		'inspect',
		(node, localName, value) =>
			node.setAttribute(`data-inspect-${localName}`, value),
		false,
	)
	propsPlugin('data-later', (node, value) =>
		node.setAttribute('data-later-ran', value),
	)

	const dispose = render(
		<div
			data-now="yes"
			data-later="soon"
			qa:test="ok"
			inspect:id="42"
		>
			hello
		</div>,
	)

	expect(body()).toBe(
		'<div data-now="yes" data-later="soon" data-test="ok" data-inspect-id="42">hello</div>',
	)

	await sleep(20)

	expect(body()).toBe(
		'<div data-now="yes" data-later="soon" data-test="ok" data-inspect-id="42">hello</div>',
	)

	dispose()
})

await test('isComponent, markComponent and makeCallback - normalize public component helpers', expect => {
	const plain = () => 'x'
	const marked = markComponent(() => 'y')
	const callback = makeCallback([
		'left',
		value => `-${value()}-`,
		'right',
	])
	const value = signal('mid')
	const staticCallback = makeCallback('plain')

	expect(isComponent(plain)).toBe(false)
	expect(isComponent(marked)).toBe(true)
	expect(isComponent(callback)).toBe(true)
	expect(isComponent(staticCallback)).toBe(true)
	expect(callback(value.read)).toEqual(['left', '-mid-', 'right'])
	expect(staticCallback()).toBe('plain')
})

await test('JSX class prop - object form adds and removes classes based on boolean values', expect => {
	const active = signal(true)
	const dispose = render(
		<p class={{ active: active.read, hidden: false, base: true }} />,
	)
	const el = $('p')
	expect(el.classList.contains('base')).toBe(true)
	expect(el.classList.contains('active')).toBe(true)
	expect(el.classList.contains('hidden')).toBe(false)
	active.write(false)
	expect(el.classList.contains('active')).toBe(false)
	dispose()
})

await test('JSX class:name prop - namespaced class toggles single class reactively', expect => {
	const on = signal(true)
	const dispose = render(<p class:highlight={on.read} />)
	const el = $('p')
	expect(el.classList.contains('highlight')).toBe(true)
	on.write(false)
	expect(el.classList.contains('highlight')).toBe(false)
	dispose()
})

await test('JSX style:name prop - sets named style property and reacts to signal', expect => {
	const color = signal('red')
	const dispose = render(<p style:color={color.read}>text</p>)
	const el = $('p')
	expect(el.style.color).toBe('red')
	color.write('blue')
	expect(el.style.color).toBe('blue')
	dispose()
})

await test('JSX on:event with handleEvent object - fires and respects once option', expect => {
	const seen = []
	const dispose = render(
		<button
			on:click={{ handleEvent: e => seen.push(e.type), once: true }}
		>
			click
		</button>,
	)
	const btn = $('button')
	btn.click()
	btn.click()
	expect(seen).toEqual(['click'])
	dispose()
})

await test('JSX on:event array - all handlers in array are called per event', expect => {
	const seen = []
	const dispose = render(
		<button on:click={[() => seen.push('a'), () => seen.push('b')]}>
			click
		</button>,
	)
	$('button').click()
	expect(seen).toEqual(['a', 'b'])
	dispose()
})

await test('use:ref - assigns the DOM element to the ref signal on mount', expect => {
	const buttonRef = ref()

	expect(buttonRef()).toBe(undefined)

	const dispose = render(
		<button use:ref={buttonRef}>click me</button>,
	)

	expect(buttonRef()).toBeInstanceOf(HTMLButtonElement)
	expect(buttonRef().textContent).toBe('click me')

	dispose()
})

await test('use:ref - accepts multiple refs as an array', expect => {
	const refA = ref()
	const refB = ref()

	const dispose = render(<p use:ref={[refA, refB]}>content</p>)

	expect(refA()).toBeInstanceOf(HTMLParagraphElement)
	expect(refB()).toBe(refA())

	dispose()
})

// --- setStyle (direct API: setElementStyle as setStyle) --------------------------

await test('setStyle - sets a single style property by name', expect => {
	const node = document.createElement('div')
	document.body.append(node)

	root(dispose => {
		setStyle(node, 'color', 'red')

		expect(node.style.color).toBe('red')

		dispose()
	})

	node.remove()
})

await test('setStyle - reactive accessor updates the style when signal changes', expect => {
	const node = document.createElement('div')
	document.body.append(node)
	const display = signal('inline')

	setStyle(node, 'display', display.read)

	expect(node.style.display).toBe('inline')

	display.write('none')
	expect(node.style.display).toBe('none')

	display.write('block')
	expect(node.style.display).toBe('block')

	node.remove()
})

await test('setStyle - null and false remove the property', expect => {
	const node = document.createElement('div')
	document.body.append(node)

	root(dispose => {
		setStyle(node, 'color', 'red')
		expect(node.style.color).toBe('red')

		setStyle(node, 'color', null)
		expect(node.style.color).toBe('')

		setStyle(node, 'display', 'flex')
		setStyle(node, 'display', false)
		expect(node.style.display).toBe('')

		dispose()
	})

	node.remove()
})

// --- setClass (direct API: setElementClass as setClass) --------------------------

await test('setClass - toggles a single class on and off', expect => {
	const node = document.createElement('div')
	document.body.append(node)

	setClass(node, 'alpha', true)
	setClass(node, 'beta', true)

	expect(node.classList.contains('alpha')).toBe(true)
	expect(node.classList.contains('beta')).toBe(true)

	setClass(node, 'alpha', false)
	expect(node.classList.contains('alpha')).toBe(false)
	expect(node.classList.contains('beta')).toBe(true)

	node.remove()
})

await test('setClass - reactive signal toggles a class', expect => {
	const node = document.createElement('div')
	document.body.append(node)
	const active = signal(true)

	setClass(node, 'active', active.read)

	expect(node.classList.contains('active')).toBe(true)

	active.write(false)
	expect(node.classList.contains('active')).toBe(false)

	active.write(true)
	expect(node.classList.contains('active')).toBe(true)

	node.remove()
})

// --- setClassList (direct API) ---------------------------------------------------

await test('setClassList - object form adds and removes classes', expect => {
	const node = document.createElement('div')
	document.body.append(node)
	const active = signal(true)

	setClassList(node, () => ({
		active: active.read(),
		hidden: !active.read(),
	}))

	expect(node.classList.contains('active')).toBe(true)
	expect(node.classList.contains('hidden')).toBe(false)

	active.write(false)

	expect(node.classList.contains('active')).toBe(false)
	expect(node.classList.contains('hidden')).toBe(true)

	node.remove()
})

await test('setClassList - string form adds space-separated classes', expect => {
	const node = document.createElement('div')
	document.body.append(node)

	root(dispose => {
		setClassList(node, 'foo bar')

		expect(node.classList.contains('foo')).toBe(true)
		expect(node.classList.contains('bar')).toBe(true)

		dispose()
	})

	node.remove()
})

await test('setClassList - clearing with empty object removes classes', expect => {
	const node = document.createElement('div')
	document.body.append(node)

	root(dispose => {
		setClassList(node, { a: true, b: true })
		expect(node.classList.contains('a')).toBe(true)
		expect(node.classList.contains('b')).toBe(true)

		setClassList(node, { a: false, b: false })
		expect(node.className).toBe('')

		dispose()
	})

	node.remove()
})

await test('setClassList - empty object is a no-op, while explicit false values remove classes', expect => {
	const node = document.createElement('div')
	document.body.append(node)

	root(dispose => {
		setClassList(node, 'alpha beta')
		expect(node.className).toBe('alpha beta')

		setClassList(node, {})
		expect(node.className).toBe('alpha beta')

		setClassList(node, { alpha: false, beta: false })
		expect(node.className).toBe('')

		dispose()
	})

	node.remove()
})

// --- setAttribute edge cases -----------------------------------------------------

await test('setAttribute - null and undefined remove the attribute', expect => {
	const node = document.createElement('div')

	setAttribute(node, 'data-x', 'value')
	expect(node.hasAttribute('data-x')).toBe(true)

	setAttribute(node, 'data-x', null)
	expect(node.hasAttribute('data-x')).toBe(false)

	setAttribute(node, 'data-y', 'value')
	setAttribute(node, 'data-y', undefined)
	expect(node.hasAttribute('data-y')).toBe(false)
})

await test('setAttribute - true sets empty string, false removes', expect => {
	const node = document.createElement('div')

	setAttribute(node, 'hidden', true)
	expect(node.getAttribute('hidden')).toBe('')

	setAttribute(node, 'hidden', false)
	expect(node.hasAttribute('hidden')).toBe(false)
})

// --- setProperty edge cases ------------------------------------------------------

await test('setProperty - null and undefined set property to null', expect => {
	const node = document.createElement('input')

	setProperty(node, 'value', 'hello')
	expect(node.value).toBe('hello')

	setProperty(node, 'value', null)
	expect(node.value).toBe('')

	setProperty(node, 'value', 'world')
	setProperty(node, 'value', undefined)
	expect(node.value).toBe('')
})
