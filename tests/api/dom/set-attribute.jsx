/** @jsxImportSource pota */

// Tests for `setAttribute()` — raw values, reactive accessors,
// boolean/null/undefined coercion, JSX boolean attributes.

import { $, test } from '#test'
import { render, root, setAttribute, setProperty, signal } from 'pota'

await test('setAttribute and setProperty - support raw values and reactive accessors', expect => {
	const node = document.createElement('input')
	const title = signal('hello')

	const dispose = root(d => {
		setAttribute(node, 'data-title', title.read)
		setProperty(node, 'value', title.read)
		return d
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

// --- reactive attribute removal ----------------------------------------------

await test('setAttribute - reactive signal switching to false removes attribute', expect => {
	const val = signal(/** @type {string | boolean} */ ('yes'))
	const node = document.createElement('div')

	const dispose = root(d => {
		setAttribute(node, 'data-active', val.read)
		return d
	})

	expect(node.getAttribute('data-active')).toBe('yes')

	val.write(false)
	expect(node.hasAttribute('data-active')).toBe(false)

	val.write('restored')
	expect(node.getAttribute('data-active')).toBe('restored')

	dispose()
})

// --- setAttribute with a number stringifies -----------------------------

await test('setAttribute - number values are coerced to strings', expect => {
	const node = document.createElement('div')
	document.body.append(node)

	setAttribute(node, 'data-count', 42)
	expect(node.getAttribute('data-count')).toBe('42')

	node.remove()
})

// --- setAttribute with an object produces "[object Object]" ----------

await test('setAttribute - object value falls back to its string form', expect => {
	const node = document.createElement('div')
	document.body.append(node)

	// Passing an object is outside the declared type — we cast to
	// exercise the default `toString()` coercion path at runtime.
	setAttribute(
		node,
		'data-object',
		/** @type {any} */ ({ a: 1 }),
	)
	expect(node.getAttribute('data-object')).toBe('[object Object]')

	node.remove()
})

// --- setAttribute with empty string sets empty value --------------

await test('setAttribute - empty string sets an empty-value attribute', expect => {
	const node = document.createElement('div')
	document.body.append(node)

	setAttribute(node, 'data-empty', '')

	expect(node.hasAttribute('data-empty')).toBe(true)
	expect(node.getAttribute('data-empty')).toBe('')

	node.remove()
})

// --- setAttribute with zero value -------------------------------

await test('setAttribute - numeric 0 stringifies and sets "0"', expect => {
	const node = document.createElement('div')
	document.body.append(node)

	setAttribute(node, 'data-count', 0)

	expect(node.getAttribute('data-count')).toBe('0')

	node.remove()
})

// --- boolean attribute semantics via JSX -------------------------------------

await test('JSX boolean attributes - true sets empty string, false removes', expect => {
	const disabled = signal(true)
	const dispose = render(
		<input disabled={disabled.read} />,
	)
	const el = $('input')

	expect(el.hasAttribute('disabled')).toBe(true)
	expect(el.getAttribute('disabled')).toBe('')

	disabled.write(false)
	expect(el.hasAttribute('disabled')).toBe(false)

	dispose()
})
