/** @jsxImportSource pota */

// Tests for `setStyle()` and the JSX `style` / `style:name` prop —
// scalar properties, object form, string `cssText`, reactive
// accessors, removal via null/undefined/false.

import { $, test } from '#test'
import { render, root, setStyle, signal } from 'pota'

await test('JSX style:name prop - sets named style property and reacts to signal', expect => {
	const color = signal('red')
	const dispose = render(<p style:color={color.read}>text</p>)
	const el = $('p')
	expect(el.style.color).toBe('red')
	color.write('blue')
	expect(el.style.color).toBe('blue')
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

// --- setStyle object and string forms ----------------------------------------

await test('setStyle - object form sets multiple properties', expect => {
	const node = document.createElement('div')
	document.body.append(node)

	root(dispose => {
		setStyle(node, 'color', 'red')
		setStyle(node, 'display', 'flex')

		expect(node.style.color).toBe('red')
		expect(node.style.display).toBe('flex')

		dispose()
	})

	node.remove()
})

// --- JSX style object form ---------------------------------------------------

await test('JSX style prop - object form sets multiple properties', expect => {
	const bg = signal('red')
	const dispose = render(
		<p style={{ color: 'blue', 'background-color': bg.read }}>
			text
		</p>,
	)
	const el = $('p')
	expect(el.style.color).toBe('blue')
	expect(el.style.backgroundColor).toBe('red')

	bg.write('green')
	expect(el.style.backgroundColor).toBe('green')

	dispose()
})

// --- JSX style string form ---------------------------------------------------

await test('JSX style prop - string form sets cssText directly', expect => {
	const dispose = render(
		<p style="color: blue; font-weight: bold">text</p>,
	)
	const el = $('p')
	expect(el.style.color).toBe('blue')
	expect(el.style.fontWeight).toBe('bold')
	dispose()
})

// --- style as reactive function returning object -----------------------------

await test('JSX style prop - reactive function returning object updates', expect => {
	const color = signal('red')
	const dispose = render(
		<p style={() => ({ color: color.read() })}>text</p>,
	)
	const el = $('p')
	expect(el.style.color).toBe('red')

	color.write('blue')
	expect(el.style.color).toBe('blue')

	dispose()
})

// --- setStyle removes with undefined/null ------------------------------------

await test('setStyle - undefined removes the property', expect => {
	const node = document.createElement('div')
	document.body.append(node)

	root(dispose => {
		setStyle(node, 'color', 'red')
		expect(node.style.color).toBe('red')

		setStyle(node, 'color', undefined)
		expect(node.style.color).toBe('')

		dispose()
	})

	node.remove()
})

await test('JSX style prop - object form accepts multiple properties (static)', expect => {
	const dispose = render(
		<div style={{ color: 'red', 'background-color': 'blue' }} />,
	)

	const el = $('div')
	expect(el.style.color).toBe('red')
	expect(el.style.backgroundColor).toBe('blue')

	dispose()
})
