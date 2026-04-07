/** @jsxImportSource pota */

// Tests for CustomElement and customElement: one-time registration,
// shadow root setup, stylesheet adoption, DOM helpers, html/hidden
// setters, slots, and emitted custom events.
import { $, test } from '#test'

import { render } from 'pota'
import { CustomElement, customElement } from 'pota/components'
import { css } from 'pota/use/css'

await test('customElement - defines a custom element only once and keeps the first constructor', expect => {
	class FirstElement extends HTMLElement {}
	class SecondElement extends HTMLElement {}

	customElement('pota-test-custom-element-once', FirstElement)
	customElement('pota-test-custom-element-once', SecondElement)

	expect(customElements.get('pota-test-custom-element-once')).toBe(
		FirstElement,
	)
})

await test('CustomElement - constructor creates a shadow root and adopts base and extra stylesheets', expect => {
	const baseSheet = css`
		:host {
			display: block;
		}
	`
	const extraSheet = css`
		span {
			color: red;
		}
	`

	class StyledElement extends CustomElement {
		static baseStyleSheets = [baseSheet]
		static styleSheets = [extraSheet]
	}

	customElement('pota-test-custom-element-styled', StyledElement)

	const element = document.createElement(
		'pota-test-custom-element-styled',
	)
	document.body.append(element)

	expect(element.shadowRoot).not.toBe(null)
	expect(element.shadowRoot.adoptedStyleSheets).toEqual([
		baseSheet,
		extraSheet,
	])

	element.remove()
})

await test('CustomElement - html accepts strings and components and hidden toggles the host attribute', expect => {
	class DemoElement extends CustomElement {}

	customElement('pota-test-custom-element-html', DemoElement)

	const element = document.createElement(
		'pota-test-custom-element-html',
	)
	document.body.append(element)

	element.html = '<p>string content</p>'
	expect(element.shadowRoot.innerHTML).toBe('<p>string content</p>')

	element.hidden = true
	expect(element.hasAttribute('hidden')).toBe(true)

	element.hidden = false
	expect(element.hasAttribute('hidden')).toBe(false)

	element.html = () => <strong>component content</strong>
	expect(element.shadowRoot.innerHTML).toBe(
		'<strong>component content</strong>',
	)

	element.remove()
})

await test('CustomElement - query and hasSlot inspect light DOM children on the host', expect => {
	class SlotElement extends CustomElement {}

	customElement('pota-test-custom-element-slots', SlotElement)

	const dispose = render(
		<pota-test-custom-element-slots>
			<span slot="title">Title</span>
			<b>Body</b>
		</pota-test-custom-element-slots>,
	)

	const element = $('pota-test-custom-element-slots')

	expect(element.hasSlot('title').outerHTML).toBe(
		'<span slot="title">Title</span>',
	)
	expect(element.query('b').outerHTML).toBe('<b>Body</b>')

	dispose()
})

await test('CustomElement - emit dispatches bubbling custom events with detail', expect => {
	class EventElement extends CustomElement {}

	customElement('pota-test-custom-element-events', EventElement)

	const element = /** @type EventElement */ (
		document.createElement('pota-test-custom-element-events')
	)
	document.body.append(element)

	const seen = []
	document.body.addEventListener(
		'done',
		event =>
			seen.push({
				target: event.target,
				detail: event.detail,
				bubbles: event.bubbles,
				composed: event.composed,
			}),
		{ once: true },
	)

	element.emit('done', { detail: { ok: true } })

	expect(seen.length).toBe(1)
	expect(seen[0].target).toBe(element)
	expect(seen[0].detail).toEqual({ ok: true })
	expect(seen[0].bubbles).toBe(true)
	expect(seen[0].composed).toBe(true)

	element.remove()
})
