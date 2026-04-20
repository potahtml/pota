/** @jsxImportSource pota */

// Tests for CustomElement and customElement: one-time registration,
// shadow root setup, stylesheet adoption, DOM helpers, html/hidden
// setters, slots, and emitted custom events.
import { $, microtask, test } from '#test'

import { render, listener } from 'pota'
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

	const element = /** @type {DemoElement} */ (
		document.createElement('pota-test-custom-element-html')
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

	const element = /** @type {SlotElement} */ (
		$('pota-test-custom-element-slots')
	)

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
				detail: /** @type {CustomEvent} */ (event).detail,
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

await test('customElement - lifecycle callbacks and property setters do not cause reactive tracking', async expect => {
	class TrackingElement extends HTMLElement {
		static observedAttributes = [
			'string-attribute',
			'stringattribute',
		]

		constructor() {
			super()
			expect(listener()).toBe(undefined)
		}
		connectedCallback() {
			expect(listener()).toBe(undefined)
		}
		disconnectedCallback() {
			expect(listener()).toBe(undefined)
		}
		adoptedCallback() {
			expect(listener()).toBe(undefined)
		}
		attributeChangedCallback(name, oldValue, newValue) {
			expect(listener()).toBe(undefined)
		}
		set boolean(value) {
			expect(listener()).toBe(undefined)
		}
		set propcasetest(value) {
			expect(listener()).toBe(undefined)
		}
		set propCASEtest(value) {
			expect(listener()).toBe(undefined)
		}
	}

	customElement('pota-test-custom-element-tracking', TrackingElement)

	const dispose = render(() => (
		<pota-test-custom-element-tracking
			string-attribute="lala"
			stringattribute="lala"
			propcasetest="lala1"
			propCASEtest="lala2"
			boolean={true}
		>
			Test
		</pota-test-custom-element-tracking>
	))

	await microtask()

	dispose()
})

// --- hasSlot returns null when the slot name is not present ------------

await test('CustomElement - hasSlot returns null for missing slot names', expect => {
	class MissingSlotElement extends CustomElement {}

	customElement(
		'pota-test-custom-element-missing-slot',
		MissingSlotElement,
	)

	const dispose = render(
		<pota-test-custom-element-missing-slot>
			<span>body only</span>
		</pota-test-custom-element-missing-slot>,
	)

	const element = /** @type {MissingSlotElement} */ (
		$('pota-test-custom-element-missing-slot')
	)

	expect(element.hasSlot('absent')).toBe(null)

	dispose()
})

// --- query returns null when no match is found -------------------------

await test('CustomElement - query returns null when no descendant matches', expect => {
	class QueryElement extends CustomElement {}

	customElement('pota-test-custom-element-query-null', QueryElement)

	const dispose = render(
		<pota-test-custom-element-query-null>
			<span>child</span>
		</pota-test-custom-element-query-null>,
	)

	const element = /** @type {QueryElement} */ (
		$('pota-test-custom-element-query-null')
	)
	expect(element.query('article')).toBe(null)

	dispose()
})

// --- hidden setter true/false idempotence ------------------------------

await test('CustomElement - setting hidden to the same value twice is stable', expect => {
	class HiddenElement extends CustomElement {}

	customElement(
		'pota-test-custom-element-hidden-idempotent',
		HiddenElement,
	)

	const element = document.createElement(
		'pota-test-custom-element-hidden-idempotent',
	)
	document.body.append(element)

	element.hidden = true
	element.hidden = true

	expect(element.getAttribute('hidden')).toBe('')

	element.hidden = false
	element.hidden = false

	expect(element.hasAttribute('hidden')).toBe(false)

	element.remove()
})

// --- emit with no detail ------------------------------------------------

await test('CustomElement - emit with no second argument still dispatches the event', expect => {
	class NoDetailElement extends CustomElement {}

	customElement('pota-test-custom-element-no-detail', NoDetailElement)

	const element = /** @type NoDetailElement */ (
		document.createElement('pota-test-custom-element-no-detail')
	)
	document.body.append(element)

	let fired = false
	element.addEventListener('ping', () => (fired = true), {
		once: true,
	})

	element.emit('ping')

	expect(fired).toBe(true)

	element.remove()
})
