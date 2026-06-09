/** @jsxImportSource pota */

// Coverage for CustomElement.js line 70: the `value || 'slot'`
// fallback in the `html` setter. When a non-string falsy value is
// assigned, isString() is false so it takes the else branch, and the
// `|| 'slot'` short-circuit replaces the shadow content with a
// freshly rendered <slot> element. The sibling test only exercises
// the truthy (component function) side of that branch.
import { test } from '#test'

import { CustomElement, customElement } from 'pota/components'

await test('CustomElement - html setter with a falsy non-string value falls back to a slot element', expect => {
	class SlotFallbackElement extends CustomElement {}

	customElement(
		'pota-test-custom-element-slot-fallback',
		SlotFallbackElement,
	)

	const element = /** @type {SlotFallbackElement} */ (
		document.createElement('pota-test-custom-element-slot-fallback')
	)
	document.body.append(element)

	// seed with some content so we can confirm the fallback replaces it
	element.html = '<p>seeded</p>'
	expect(element.shadowRoot.innerHTML).toBe('<p>seeded</p>')

	// null is not a string -> else branch -> `null || 'slot'` -> <slot>
	element.html = null
	expect(element.shadowRoot.innerHTML).toBe('<slot></slot>')
	expect(element.shadowRoot.children.length).toBe(1)
	expect(element.shadowRoot.firstElementChild.localName).toBe('slot')

	element.remove()
})

await test('CustomElement - html setter with undefined also falls back to a slot element', expect => {
	class SlotFallbackUndefinedElement extends CustomElement {}

	customElement(
		'pota-test-custom-element-slot-fallback-undefined',
		SlotFallbackUndefinedElement,
	)

	const element = /** @type {SlotFallbackUndefinedElement} */ (
		document.createElement(
			'pota-test-custom-element-slot-fallback-undefined',
		)
	)
	document.body.append(element)

	element.html = undefined
	expect(element.shadowRoot.firstElementChild.localName).toBe('slot')

	element.remove()
})
