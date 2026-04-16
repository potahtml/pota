/** @jsxImportSource pota */

// Tests for `resolve()` — flatten reactive children, stable accessor
// for props.children, nested function unwrapping, plain values.

import { test, body } from '#test'
import { signal, resolve, unwrap, render } from 'pota'

await test('resolve and unwrap - flatten nested children and keep them reactive', expect => {
	const count = signal('a')
	const resolved = resolve(() => [() => count.read(), ['!']])

	expect(unwrap([['x'], () => ['y', ['z']]])).toEqual(['x', 'y', 'z'])
	expect(resolved()).toEqual(['a', '!'])

	count.write('b')

	expect(resolved()).toEqual(['b', '!'])
})

await test('resolve - wrapping props.children gives a stable memoized accessor', expect => {
	const evaluations = []

	function Menu(props) {
		const items = resolve(() => {
			evaluations.push('evaluated')
			return props.children
		})
		return <ul>{items}</ul>
	}

	const dispose = render(
		<Menu>
			<li>one</li>
			<li>two</li>
		</Menu>,
	)

	expect(body()).toBe('<ul><li>one</li><li>two</li></ul>')
	expect(evaluations).toEqual(['evaluated'])

	dispose()
})

// --- resolve with nested functions -------------------------------------------

await test('resolve - unwraps nested functions of arrays', expect => {
	const v = signal('x')
	const resolved = resolve(() => [() => [() => v.read(), 'y']])

	expect(resolved()).toEqual(['x', 'y'])

	v.write('z')
	expect(resolved()).toEqual(['z', 'y'])
})

// --- resolve - unwrapping a simple value --------------------------

await test('resolve - unwraps a plain value to itself', expect => {
	// `resolve` always returns a memo accessor; call it to get the
	// underlying value.
	expect(resolve('plain')()).toBe('plain')
	expect(resolve(42)()).toBe(42)
	expect(resolve(true)()).toBe(true)
	expect(resolve(null)()).toBe(null)
})
