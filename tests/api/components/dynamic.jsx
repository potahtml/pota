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
			component={props => props.items.map(item => <p>{item}</p>)}
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

await test('Dynamic - DOESNT switches between tag names, functions and existing nodes reactively', expect => {
	const node = document.createElement('aside')
	node.textContent = 'node'

	const current = signal('p')

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
			component={props => props.list.map(item => item + '!')}
			list={[1, 2, 3]}
		/>,
	)
	expect(body()).toBe('1!2!3!')
	dispose()
})

await test('Dynamic - function component filtering list returns subset', expect => {
	const dispose = render(
		<Dynamic
			component={props => props.list.filter(item => item % 2 === 0)}
			list={[1, 2, 3, 4]}
		/>,
	)
	expect(body()).toBe('24')
	dispose()
})
