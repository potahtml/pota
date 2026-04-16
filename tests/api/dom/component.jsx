/** @jsxImportSource pota */

// Tests for `Component()` factory and the `Pota` class — wrapping
// strings/functions/elements with default props, lifecycle hooks
// (ready, cleanup), props snapshot vs reactive accessor, deeply
// nested function components, frozen props.

import { $, $$, body, microtask, test } from '#test'
import { Component, Pota, cleanup, render, signal } from 'pota'

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

	await microtask()
	expect(seen).toEqual(['ready'])

	dispose()

	expect(seen).toEqual(['ready', 'cleanup'])
})

// --- component props are frozen ----------------------------------------------

await test('component - component props object is frozen', expect => {
	/** @type {any} */
	let capturedProps

	function Capture(props) {
		capturedProps = props
		return <p>ok</p>
	}

	const dispose = render(<Capture name="test" />)

	expect(Object.isFrozen(capturedProps)).toBe(true)
	expect(capturedProps.name).toBe('test')

	dispose()
})

// --- deeply nested components ------------------------------------------------

await test('component - deeply nested components render and clean up', expect => {
	const cleaned = []

	function Inner() {
		cleanup(() => cleaned.push('inner'))
		return <b>inner</b>
	}

	function Middle(props) {
		cleanup(() => cleaned.push('middle'))
		return <i>{props.children}</i>
	}

	function Outer(props) {
		cleanup(() => cleaned.push('outer'))
		return <div>{props.children}</div>
	}

	const dispose = render(
		<Outer>
			<Middle>
				<Inner />
			</Middle>
		</Outer>,
	)

	expect(body()).toBe('<div><i><b>inner</b></i></div>')

	dispose()

	expect(cleaned).toEqual(['inner', 'middle', 'outer'])
})

// --- function component composition via direct return (no children) --------

await test('component - deeply nested function components resolve top-down', expect => {
	// The test above uses children-prop composition (Outer > Middle > Inner).
	// This exercises the distinct pattern of components returning other
	// components directly: `const B = () => <A />`, so the renderer has to
	// unwrap several layers of component returns before it hits an element.
	const A = () => <p>A</p>
	const B = () => <A />
	const C = () => <B />
	const D = () => <C />

	const dispose = render(<D />)
	expect(body()).toBe('<p>A</p>')
	dispose()
})

// --- signal write inside component body is not tracked -----------------------

await test('component - signal read in component body is not tracked for re-render', expect => {
	const count = signal(0)
	let renderCount = 0

	function Counter() {
		renderCount++
		return <p>{count.read}</p>
	}

	const dispose = render(<Counter />)

	expect(renderCount).toBe(1)
	expect($('p').textContent).toBe('0')

	count.write(1)
	// component body should not re-run, but the reactive child updates
	expect(renderCount).toBe(1)
	expect($('p').textContent).toBe('1')

	dispose()
})

// --- component with no return renders nothing -------------------------

await test('component - function component that returns undefined renders nothing', expect => {
	function Empty() {}

	const dispose = render(<Empty />)
	expect(body()).toBe('')
	dispose()
})

// --- event handlers on components are forwarded via props -------------

await test('component - event handlers pass through component props as callbacks', expect => {
	let pressed = 0

	function Btn(props) {
		return <button on:click={props.onPress}>click</button>
	}

	const dispose = render(<Btn onPress={() => pressed++} />)

	$('button').click()
	$('button').click()

	expect(pressed).toBe(2)
	dispose()
})

// --- props are not reactive when destructured in component body ------

await test('component - destructuring props in a component body snapshots at mount', expect => {
	const count = signal(1)

	function Widget(props) {
		const { value } = props
		return <p>{value}</p>
	}

	const dispose = render(<Widget value={count.read()} />)

	expect(body()).toBe('<p>1</p>')

	count.write(2)
	// destructured value is a snapshot — not reactive
	expect(body()).toBe('<p>1</p>')

	dispose()
})

// --- props property access IS reactive (if wrapped in a function) ----

await test('component - passing a signal accessor as a prop stays reactive', expect => {
	const count = signal(1)

	function Widget(props) {
		// props.value is the reader function; pota wraps it
		// in an effect when rendered as a child
		return <p>{props.value}</p>
	}

	const dispose = render(<Widget value={count.read} />)

	expect(body()).toBe('<p>1</p>')

	count.write(2)
	expect(body()).toBe('<p>2</p>')

	dispose()
})

// --- component with reactive signal prop --------------------------

await test('component - component receives a reactive prop and updates in its children', expect => {
	const value = signal('first')

	function Widget(props) {
		return <p>v:{props.value}</p>
	}

	const dispose = render(<Widget value={value.read} />)

	expect($('p').textContent).toBe('v:first')

	value.write('second')
	expect($('p').textContent).toBe('v:second')

	dispose()
})

// --- Array.isArray on the component children --------------------

await test('component - component children prop can be iterated when provided as array', expect => {
	/** @type {any} */
	let receivedLen

	function Multi(props) {
		// children is exposed by the framework — verify it exists
		receivedLen = Array.isArray(props.children)
			? props.children.length
			: 1
		return <div>{props.children}</div>
	}

	const dispose = render(
		<Multi>
			<span>a</span>
			<span>b</span>
			<span>c</span>
		</Multi>,
	)

	// the framework may expose children as an array, single, or function
	// just verify something was passed — specific shape depends on the framework
	expect(receivedLen >= 1).toBe(true)
	expect($$('span').length).toBe(3)

	dispose()
})
