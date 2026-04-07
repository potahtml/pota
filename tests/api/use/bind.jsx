/** @jsxImportSource pota */

import { test } from '#test'

import { render, signal } from 'pota'
import { bind } from 'pota/use/bind'

await test('bind - returns a readable and writable signal-like function', expect => {
	const value = bind('hello')

	expect(value()).toBe('hello')

	value('world')

	expect(value()).toBe('world')
})

await test('bind - use:bind syncs text input both ways', expect => {
	const value = bind('start')
	const dispose = render(<input use:bind={value} />)
	const input = document.querySelector('input')

	expect(input.value).toBe('start')

	value('changed')
	expect(input.value).toBe('changed')

	input.value = 'typed'
	input.dispatchEvent(new Event('input', { bubbles: true }))
	expect(value()).toBe('typed')

	dispose()
})

await test('bind - use:bind syncs checkbox checked state', expect => {
	const checked = bind(true)
	const dispose = render(
		<input
			type="checkbox"
			use:bind={checked}
		/>,
	)
	const input = document.querySelector('input')

	expect(input.checked).toBe(true)

	checked(false)
	expect(input.checked).toBe(false)

	input.checked = true
	input.dispatchEvent(new Event('input', { bubbles: true }))
	expect(checked()).toBe(true)

	dispose()
})

await test('bind - use:bind syncs radio groups by value', expect => {
	const selected = bind('b')
	const dispose = render(
		<>
			<input
				type="radio"
				name="choice"
				value="a"
				use:bind={selected}
			/>
			<input
				type="radio"
				name="choice"
				value="b"
				use:bind={selected}
			/>
		</>,
	)
	const [a, b] = document.querySelectorAll('input')

	expect(a.checked).toBe(false)
	expect(b.checked).toBe(true)

	a.checked = true
	a.dispatchEvent(new Event('input', { bubbles: true }))
	expect(selected()).toBe('a')

	selected('b')
	expect(a.checked).toBe(false)
	expect(b.checked).toBe(true)

	dispose()
})

await test('bind - bind can wrap a computed accessor', expect => {
	const source = signal('first')
	const value = bind(source.read)

	expect(value()).toBe('first')

	source.write('second')
	expect(value()).toBe('second')
})

await test('bind - use:bind syncs contenteditable nodes through innerText', expect => {
	const value = bind('hello')
	const dispose = render(
		<div
			contentEditable
			use:bind={value}
		/>,
	)
	const node = document.querySelector('div')

	expect(node.innerText).toBe('hello')

	value('updated')
	expect(node.innerText).toBe('updated')

	node.innerText = 'typed'
	node.dispatchEvent(new Event('input', { bubbles: true }))
	expect(value()).toBe('typed')

	dispose()
})

await test('bind - use:bind syncs select element both ways', expect => {
	const selected = bind('1')
	const dispose = render(
		<select use:bind={selected}>
			<option value="0">zero</option>
			<option value="1">one</option>
			<option value="2">two</option>
		</select>,
	)

	const el = document.querySelector('select')

	expect(el.value).toBe('1')

	el.value = '2'
	el.dispatchEvent(new Event('input', { bubbles: true }))
	expect(selected()).toBe('2')

	selected('0')
	expect(el.value).toBe('0')

	dispose()
})
