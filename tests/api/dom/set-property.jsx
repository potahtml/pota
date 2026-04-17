/** @jsxImportSource pota */

// Tests for `setProperty()` — direct DOM property assignment, JSX
// `prop:` namespace, reactive accessors, attribute-vs-property
// boundary.

import { $, $$, body, test } from '#test'
import { render, root, setProperty, signal } from 'pota'

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

// --- prop: namespace ---------------------------------------------------------

await test('JSX prop:name - sets DOM property instead of attribute', expect => {
	const dispose = render(
		<input prop:value="hello" />,
	)
	const el = $('input')
	expect(el.value).toBe('hello')
	expect(el.getAttribute('value')).toBe(null)
	dispose()
})

await test('JSX prop:innerHTML - sets HTML content via property', expect => {
	const dispose = render(
		<div prop:innerHTML="<b>bold</b>" />,
	)
	expect(body()).toBe('<div><b>bold</b></div>')
	dispose()
})

// --- setProperty reactive ----------------------------------------------------

await test('setProperty - reactive signal updates property', expect => {
	const node = document.createElement('input')
	const val = signal('first')

	const dispose = root(d => {
		setProperty(node, 'value', val.read)
		return d
	})

	expect(node.value).toBe('first')

	val.write('second')
	expect(node.value).toBe('second')

	dispose()
})

// --- setProperty can round-trip arbitrary types -----------------------

await test('setProperty - stores any value directly on the element', expect => {
	const node = document.createElement('div')
	document.body.append(node)

	const payload = { user: 'Ada' }
	setProperty(node, 'customPayload', payload)

	expect(/** @type {any} */ (node).customPayload).toBe(payload)

	node.remove()
})

await test('JSX prop: vs plain prop - plain props default to attributes, prop:innerHTML writes the DOM property', expect => {
	const dispose = render(
		<>
			<div {...{ innerHTML: '<b>attribute only</b>' }} />
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

// --- <progress> null case ------------------------------------------------

await test('setProperty - null / undefined on progress.value do not break the element', expect => {
	// The source comment in `props/property.js` calls this out:
	// writing `undefined` to `progress.value` breaks the whole tag.
	// The setter normalises nullish writes to `null` so the element
	// returns to its indeterminate state cleanly.
	const node = document.createElement('progress')
	node.max = 100
	document.body.append(node)

	setProperty(node, 'value', 50)
	expect(node.value).toBe(50)

	setProperty(node, 'value', null)
	// After `null`, progress.value reports 0 (the spec's "no value"
	// reading). The key is that neither the write nor the readback
	// throws.
	expect(node.value).toBe(0)

	setProperty(node, 'value', 75)
	expect(node.value).toBe(75)

	setProperty(node, 'value', undefined)
	expect(node.value).toBe(0)

	node.remove()
})
