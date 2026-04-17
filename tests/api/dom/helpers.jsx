// Tests for `isComponent`, `markComponent`, `makeCallback` —
// component identity helpers.

import { test } from '#test'
import { isComponent, makeCallback, markComponent, signal } from 'pota'

await test('isComponent, markComponent and makeCallback - normalize public component helpers', expect => {
	const plain = () => 'x'
	const marked = markComponent(() => 'y')
	const callback = makeCallback([
		'left',
		/** @type {(value: () => string) => string} */ (
			value => `-${value()}-`
		),
		'right',
	])
	const value = signal('mid')
	const staticCallback = makeCallback('plain')

	expect(isComponent(plain)).toBe(false)
	expect(isComponent(marked)).toBe(true)
	expect(isComponent(callback)).toBe(true)
	expect(isComponent(staticCallback)).toBe(true)
	expect(callback(value.read)).toEqual(['left', '-mid-', 'right'])
	expect(staticCallback()).toBe('plain')
})

// --- isComponent on non-function values ----------------------

await test('isComponent - primitive values return false', expect => {
	expect(isComponent(42)).toBe(false)
	expect(isComponent('string')).toBe(false)
	expect(isComponent(null)).toBe(false)
	expect(isComponent(undefined)).toBe(false)
})
