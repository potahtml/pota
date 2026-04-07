/** @jsxImportSource pota */

// Cross-cutting developer expectations: timing/order surprises,
// attribute-vs-property semantics, immediate Suspense behavior, and
// hidden-but-mounted Collapse state.
import { $, $$, body, microtask, test } from '#test'

import { ready, render, signal } from 'pota'
import { Collapse, Suspense } from 'pota/components'

await test('expectations - render inserts DOM synchronously, ref is immediate, and connected/ready wait for the next microtask', async expect => {
	const seen = []

	function Widget() {
		console.log(1, seen.join(','))

		ready(() => {
			console.log(2, seen.join(','))

			console.log(
				document.body.childNodes,
				$('p'),
			)
			seen.push('ready:' + $('p')?.textContent)
		})

		return (
			<p
				use:ref={node => seen.push('ref:' + node.textContent)}
				use:connected={node =>
					seen.push('connected:' + node.textContent, node.isConnected)
				}
			>
				hello
			</p>
		)
	}
	const dispose = render(<Widget />)
	console.log(3, seen.join(','))

	expect(body()).toBe('<p>hello</p>')
	expect(seen).toEqual(['ref:hello'])

	await microtask()
	await microtask()
	console.log(4, seen.join(','))

	expect(seen).toEqual([
		'ref:hello',
		'connected:hello',
		'ready:hello',
	])

	dispose()
})

await test('expectations - plain props default to attributes, so prop:innerHTML is required for DOM content writes', expect => {
	const dispose = render(
		<>
			<div innerHTML="<b>attribute only</b>" />
			<div prop:innerHTML="<b>real content</b>" />
		</>,
	)

	const [attributeDiv, propertyDiv] = $$('div')

	expect(attributeDiv.innerHTML).toBe('')
	expect(attributeDiv.getAttribute('innerhtml')).toBe(
		'<b>attribute only</b>',
	)

	expect(propertyDiv.innerHTML).toBe('<b>real content</b>')
	expect(propertyDiv.hasAttribute('innerhtml')).toBe(false)

	dispose()
})

await test('expectations - Suspense shows sync children immediately but shows fallback immediately when a promise is present', async expect => {
	const disposeSync = render(
		<Suspense fallback={<p>loading</p>}>
			<p>sync child</p>
		</Suspense>,
	)

	expect(body()).toBe('<p>sync child</p>')

	disposeSync()

	const asyncChild = new Promise(resolve => {
		setTimeout(() => resolve(<p>async child</p>), 100)
	})

	const disposeAsync = render(
		<Suspense fallback={<p>loading</p>}>{asyncChild}</Suspense>,
	)

	expect(body()).toBe('<p>loading</p>')

	await asyncChild

	expect(body()).toBe('<p>async child</p>')

	disposeAsync()
})

await test('expectations - Collapse hides output without unmounting uncontrolled child state', expect => {
	const visible = signal(true)

	const dispose = render(
		<Collapse when={visible.read}>
			<input
				id="field"
				value="start"
			/>
		</Collapse>,
	)

	const input = document.getElementById('field')
	input.value = 'typed'

	const collapse = document.getElementsByTagName('pota-collapse')[0]

	// showing
	expect(collapse.shadowRoot.innerHTML).toBe('<slot></slot>')

	visible.write(false)

	// empty
	expect(collapse.shadowRoot.innerHTML).toBe('')

	expect(document.getElementById('field')).toBe(input)
	expect(input.value).toBe('typed')

	visible.write(true)

	expect(collapse.shadowRoot.innerHTML).toBe('<slot></slot>')
	expect(document.getElementById('field')).toBe(input)
	expect(document.getElementById('field').value).toBe('typed')

	dispose()
})
