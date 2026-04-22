/** @jsxImportSource pota */
// Targeted tests for remaining props/* coverage gaps:
//   - setAttributeNS (xlink:href set/remove)
//   - setClassNS with an object value (plural class map)

import { microtask, test, $ } from '#test'
import { render, signal } from 'pota'

// removeAttribute arm for a namespaced attribute with an unknown
// namespace (nada: is not in the NS map). A reactive null value
// triggers the fallback removeAttribute branch in _setAttributeNS.

await test('attribute NS - removes unknown-ns prefixed attribute via removeAttribute', async expect => {
	const v = signal('hello')
	const dispose = render(
		<div
			// @ts-expect-error — intentional unknown namespaced attr
			nada:nada={v.read}
		>
			x
		</div>,
	)
	await microtask()
	const div = $('div')
	expect(div.getAttribute('nada:nada')).toBe('hello')

	v.write(null)
	await microtask()
	expect(div.getAttribute('nada:nada')).toBe(null)

	dispose()
})

// style:name={object} takes the `isObject(value) ? value` branch of
// setStyleNS, passing the whole object to setNodeStyle — the
// localName in the JSX attribute is ignored when the value is an
// object (no such behavior on React, but pota routes it this way).

await test('style NS - object value bypasses localName key wrapping', async expect => {
	const dispose = render(
		<div
			// @ts-expect-error — intentional object value on a non-existent
			// style:ignored sub-key exercises the isObject branch
			style:ignored={{ color: 'rgb(0, 128, 0)' }}
		>
			x
		</div>,
	)
	await microtask()
	const div = $('div')
	expect(div.style.color).toBe('rgb(0, 128, 0)')
	dispose()
})

// xlink:href on <use> flows through assignProp → setAttributeNS.
// A reactive signal value exercises both the set and the remove
// branches (value === null removes via NS).

await test('attribute NS - xlink:href sets and removes via setAttributeNS', async expect => {
	const href = signal('#icon-a')
	const dispose = render(
		<svg>
			<use xlink:href={href.read} />
		</svg>,
	)
	await microtask()
	const use = $('use')
	expect(
		use.getAttributeNS('http://www.w3.org/1999/xlink', 'href'),
	).toBe('#icon-a')

	href.write(null)
	await microtask()
	expect(
		use.getAttributeNS('http://www.w3.org/1999/xlink', 'href'),
	).toBe(null)

	dispose()
})

// Literal `true` on a namespaced attribute in the known-NS branch:
// _setAttributeNS should setAttributeNS with an empty string.

await test('attribute NS - xlink:href={true} sets empty string via setAttributeNS', async expect => {
	const dispose = render(
		<svg>
			<use xlink:href={true} />
		</svg>,
	)
	await microtask()
	const use = $('use')
	expect(
		use.getAttributeNS('http://www.w3.org/1999/xlink', 'href'),
	).toBe('')

	dispose()
})

// Literal `true` on a namespaced attribute whose namespace is NOT in
// the NS map: _setAttributeNS falls back to plain setAttribute with
// the qualified name, again coercing `true` to the empty string.

await test('attribute NS - unknown-ns prefixed attr with true falls back to empty setAttribute', async expect => {
	const dispose = render(
		<div
			// @ts-expect-error — intentional unknown namespaced attr
			nada:foo={true}
		>
			x
		</div>,
	)
	await microtask()
	const div = $('div')
	expect(div.getAttribute('nada:foo')).toBe('')

	dispose()
})

// class:name={object} through the runtime dispatcher takes the
// setClassList branch of setClassNS — the localName is ignored and
// the object keys become the class names. The babel preset inlines
// inline `class:foo={...}` directly to setClass (setElementClass),
// so a spread is used to force the runtime path through
// assignProps → assignProp → setClassNS.

await test('class NS - object value via spread bypasses localName and applies object keys', async expect => {
	const props = /** @type {any} */ ({
		'class:ignored': { a: true, b: false },
	})
	const dispose = render(<p {...props} />)
	await microtask()
	const p = $('p')
	expect(p.classList.contains('a')).toBe(true)
	expect(p.classList.contains('b')).toBe(false)
	expect(p.classList.contains('ignored')).toBe(false)

	dispose()
})

