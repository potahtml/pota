/** @jsxImportSource pota */
// Tests for pota/use/bind: two-way binding for text, checkbox,
// radio, contenteditable, select, number, and textarea inputs.

import { test, $, $$, microtask } from '#test'

import { render, signal } from 'pota'
import { bind } from 'pota/use/bind'

await test('bind - returns a readable and writable signal-like function', expect => {
	const value = bind('hello')

	expect(value()).toBe('hello')

	value('world')

	expect(value()).toBe('world')
})

await test('bind - use:bind syncs text input both ways', async expect => {
	const value = bind('start')
	expect(value() + ' in signal').toBe('start in signal')

	const dispose = render(<input use:bind={value} />)
	const input = $('input')

	await microtask()
	expect(input.value).toBe('start')

	value('changed')
	expect(input.value).toBe('changed')

	input.value = 'typed'
	input.dispatchEvent(new Event('input', { bubbles: true }))
	expect(value()).toBe('typed')

	dispose()
})

await test('bind - use:bind syncs checkbox checked state', async expect => {
	const checked = bind(true)
	const dispose = render(<input type="checkbox" use:bind={checked} />)
	const input = $('input')

	await microtask()

	expect(input.checked).toBe(true)

	checked(false)
	expect(input.checked).toBe(false)

	input.checked = true
	input.dispatchEvent(new Event('input', { bubbles: true }))
	expect(checked()).toBe(true)

	dispose()
})

await test('bind - use:bind syncs radio groups by value', async expect => {
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
	const [a, b] = $$('input')

	await microtask()

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

await test('bind - use:bind syncs contenteditable nodes through innerText', async expect => {
	const value = bind('hello')
	const dispose = render(
		<div contenteditable="true" use:bind={value} />,
	)
	const node = $('div')

	await microtask()

	expect(node.innerText).toBe('hello')

	value('updated')
	expect(node.innerText).toBe('updated')

	node.innerText = 'typed'
	node.dispatchEvent(new Event('input', { bubbles: true }))
	expect(value()).toBe('typed')

	dispose()
})

await test('bind - use:bind syncs select element both ways', async expect => {
	const selected = bind('1')
	const dispose = render(
		<select use:bind={selected}>
			<option value="0">zero</option>
			<option value="1">one</option>
			<option value="2">two</option>
		</select>,
	)

	await microtask()

	const el = $('select')

	expect(el.value).toBe('1')

	el.value = '2'
	el.dispatchEvent(new Event('input', { bubbles: true }))
	expect(selected()).toBe('2')

	selected('0')
	expect(el.value).toBe('0')

	dispose()
})

await test('bind - select element pre-selects matching option on mount', async expect => {
	const selected = bind('2')
	const dispose = render(
		<select use:bind={selected}>
			<option value="0">zero</option>
			<option value="1">one</option>
			<option value="2">two</option>
		</select>,
	)

	await microtask()

	expect($('select').value).toBe('2')

	dispose()
})

await test('bind - bind with initial undefined starts with empty value', expect => {
	const value = bind()
	expect(value()).toBe(undefined)

	value('hello')
	expect(value()).toBe('hello')
})

await test('bind - use:bind on number input syncs numeric string', async expect => {
	const val = bind('5')
	const dispose = render(<input type="number" use:bind={val} />)

	await microtask()

	const el = $('input')
	expect(el.value).toBe('5')

	el.value = '10'
	el.dispatchEvent(new Event('input', { bubbles: true }))
	expect(val()).toBe('10')

	val('0')
	expect(el.value).toBe('0')

	dispose()
})

await test('bind - use:bind on textarea syncs value', async expect => {
	const val = bind('initial')
	const dispose = render(<textarea use:bind={val} />)

	await microtask()

	const el = $('textarea')
	expect(el.value).toBe('initial')

	el.value = 'typed'
	el.dispatchEvent(new Event('input', { bubbles: true }))
	expect(val()).toBe('typed')

	dispose()
})

// --- bind with empty string ----------------------------------------

await test('bind - bind with empty string initial value', async expect => {
	const value = bind('')
	expect(value()).toBe('')

	const dispose = render(<input use:bind={value} />)
	await microtask()

	expect($('input').value).toBe('')

	value('something')
	expect($('input').value).toBe('something')

	dispose()
})

// --- unbinding via dispose leaves signal value in place ------------

await test('bind - disposing the JSX scope leaves the bind signal value intact', async expect => {
	const value = bind('hello')
	const dispose = render(<input use:bind={value} />)

	await microtask()

	value('world')
	expect($('input').value).toBe('world')

	dispose()

	// Signal is still usable after dispose
	value('after-dispose')
	expect(value()).toBe('after-dispose')
})

// --- bind with number as initial value -----------------------------

await test('bind - bind accepts numeric initial values', expect => {
	const value = bind(42)
	expect(value()).toBe(42)

	value(100)
	expect(value()).toBe(100)
})

// --- multiple distinct binds are independent ----------------------

await test('bind - multiple independent bind signals do not interfere', expect => {
	const a = bind('a')
	const b = bind('b')

	a('changed')

	expect(a()).toBe('changed')
	expect(b()).toBe('b')
})
