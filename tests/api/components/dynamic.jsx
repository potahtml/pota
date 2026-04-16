/** @jsxImportSource pota */

// Tests for the Dynamic component: string tags, function components,
// multi-node returns, existing DOM elements, and reactive switching.
import { $, test, body } from '#test'

import { render, signal } from 'pota'
import { Dynamic } from 'pota/components'

await test('Dynamic - renders string tags and forwards props without leaking component', expect => {
	const dispose = render(
		<Dynamic
			component="button"
			id="action"
			class="cta"
		>
			click
		</Dynamic>,
	)

	expect($('button').outerHTML).toBe(
		'<button class="cta" id="action">click</button>',
	)
	expect($('button').hasAttribute('component')).toBe(false)

	dispose()
})

await test('Dynamic - renders function components and forwards children and props', expect => {
	const dispose = render(
		<Dynamic
			component={props => (
				<section data-kind={props.kind}>{props.children}</section>
			)}
			kind="panel"
		>
			<p>inside</p>
		</Dynamic>,
	)

	expect(body()).toBe(
		'<section data-kind="panel"><p>inside</p></section>',
	)

	dispose()
})

await test('Dynamic - supports function components that return multiple nodes', expect => {
	const dispose = render(
		<Dynamic
			component={
				/** @param {any} props */
				props => props.items.map(item => <p>{item}</p>)
			}
			items={['a', 'b', 'c']}
		/>,
	)

	expect(body()).toBe('<p>a</p><p>b</p><p>c</p>')

	dispose()
})

await test('Dynamic - supports existing element values as components', expect => {
	const node = document.createElement('hr')
	node.setAttribute('data-static', 'yes')

	const dispose = render(<Dynamic component={node} />)

	expect($('hr')).toBe(node)
	expect(body()).toBe('<hr data-static="yes">')

	dispose()
})

await test('Dynamic - pre-existing node values are preserved across render', expect => {
	// The hr-based test above uses a void element with no children, so
	// it only exercises attribute preservation. This variant uses a node
	// that carries existing textContent to guard against Dynamic clearing
	// the children of an element handed to it.
	const node = document.createElement('div')
	node.textContent = 'pre-existing'
	node.setAttribute('data-marker', 'yes')

	const dispose = render(<Dynamic component={node} />)

	expect(node.textContent).toBe('pre-existing')
	expect(node.getAttribute('data-marker')).toBe('yes')

	dispose()
})

await test('Dynamic - does NOT switch between tag names, functions and existing nodes reactively', expect => {
	const node = document.createElement('aside')
	node.textContent = 'node'

	const current = signal(
		/** @type {string | ((props: any) => any)} */ ('p'),
	)

	const dispose = render(() => (
		<Dynamic component={current.read()}>content</Dynamic>
	))

	expect(body()).toBe('<p>content</p>')

	current.write(props => <strong>{props.children}</strong>)
	expect(body()).toBe('<p>content</p>')

	dispose()
})

await test('Dynamic - function component returning array of primitives (no JSX)', expect => {
	const dispose = render(
		<Dynamic
			component={
				/** @param {any} props */
				props => props.list.map(item => item + '!')
			}
			list={[1, 2, 3]}
		/>,
	)
	expect(body()).toBe('1!2!3!')
	dispose()
})

await test('Dynamic - function component filtering list returns subset', expect => {
	const dispose = render(
		<Dynamic
			component={
				/** @param {any} props */
				props => props.list.filter(item => item % 2 === 0)
			}
			list={[1, 2, 3, 4]}
		/>,
	)
	expect(body()).toBe('24')
	dispose()
})

// --- text children to a string-tagged Dynamic ---------------------------

await test('Dynamic - plain string children render inside a string-tag component', expect => {
	const dispose = render(
		<Dynamic component="span">hello world</Dynamic>,
	)

	expect($('span').textContent).toBe('hello world')

	dispose()
})

// --- Dynamic without children does not add any text nodes ---------------

await test('Dynamic - no children results in an empty element', expect => {
	const dispose = render(<Dynamic component="section" />)

	expect($('section').childNodes.length).toBe(0)

	dispose()
})

// --- function component returning null produces no output --------------

await test('Dynamic - function component returning null renders nothing', expect => {
	const dispose = render(<Dynamic component={() => null} />)

	expect(body()).toBe('')

	dispose()
})

// --- function component returning undefined produces no output --------

await test('Dynamic - function component returning undefined renders nothing', expect => {
	const dispose = render(<Dynamic component={() => undefined} />)

	expect(body()).toBe('')

	dispose()
})

// --- function component returning a string value ------------------------

await test('Dynamic - function component returning a string renders as text', expect => {
	const dispose = render(
		<Dynamic
			component={props => props.message}
			message="hello"
		/>,
	)

	expect(body()).toBe('hello')

	dispose()
})

// --- function component returning a number as text ---------------------

await test('Dynamic - function component returning a number renders the number as text', expect => {
	const dispose = render(
		<Dynamic
			component={props => props.count}
			count={42}
		/>,
	)

	expect(body()).toBe('42')

	dispose()
})

// --- props containing a signal-based reactive value --------------------

await test('Dynamic - reactive text children in a function component update on signal change', expect => {
	const name = signal('Ada')

	const dispose = render(
		<Dynamic component={() => <p>{name.read}</p>} />,
	)

	expect(body()).toBe('<p>Ada</p>')

	name.write('Grace')

	expect(body()).toBe('<p>Grace</p>')

	dispose()
})

// --- Dynamic forwarding event handlers to a string tag ----------------

await test('Dynamic - on: event handlers attach to the element', expect => {
	let clicked = 0

	const dispose = render(
		<Dynamic
			component="button"
			on:click={() => clicked++}
		>
			click
		</Dynamic>,
	)

	$('button').click()
	expect(clicked).toBe(1)

	$('button').click()
	expect(clicked).toBe(2)

	dispose()
})

