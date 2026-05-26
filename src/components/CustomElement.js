import { isString } from '../lib/std.js'

import { Component, toHTMLFragment } from '../core/renderer.js'
import { addStyleSheets } from '../use/css.js'
import {
	querySelector,
	removeAttribute,
	setAttribute,
} from '../use/dom.js'
import { emit } from '../use/event.js'

/**
 * Defines a custom Element (if isnt defined already)
 *
 * @param {string} name - Name for the custom element
 * @param {CustomElementConstructor} constructor - Class for the
 *   custom element
 * @param {ElementDefinitionOptions} [options] - Options passed to
 *   `customElements.define`
 */
export function customElement(name, constructor, options) {
	if (customElements.get(name) === undefined) {
		customElements.define(name, constructor, options)
	}
}

export class CustomElement extends HTMLElement {
	/**
	 * Static base stylesheets for the custom element.
	 *
	 * @type {(CSSStyleSheet | string)[]}
	 */
	static baseStyleSheets = []

	/**
	 * Static additional stylesheets for the custom element.
	 *
	 * @type {(CSSStyleSheet | string)[]}
	 */
	static styleSheets = []
	constructor() {
		super()

		const shadowRoot = this.attachShadow({
			mode: 'open',
		})

		// this is needed because `baseStyleSheets/styleSheets` are `static`
		const constructor = /** @type {typeof CustomElement} */ (
			this.constructor
		)

		addStyleSheets(shadowRoot, constructor.baseStyleSheets)
		addStyleSheets(shadowRoot, constructor.styleSheets)
	}

	/* DOM API */

	/**
	 * Shortcut for querySelector
	 *
	 * @param {string} query
	 */
	query(query) {
		return querySelector(this, query)
	}
	/**
	 * Shortcut for this.shadowRoot.innerHTML
	 *
	 * @param {string | Component} value
	 */
	set html(value) {
		if (isString(value)) {
			this.shadowRoot.innerHTML = value
		} else {
			this.shadowRoot.replaceChildren(
				toHTMLFragment(Component(value || 'slot')),
			)
		}
	}

	/**
	 * Toggles attribute `hidden`
	 *
	 * @param {boolean} value
	 */
	set hidden(value) {
		value
			? setAttribute(this, 'hidden', '')
			: removeAttribute(this, 'hidden')
	}

	/* EVENTS API */

	/**
	 * Emits an event
	 *
	 * @param {string} eventName
	 * @param {any} [data]
	 */
	emit(eventName, data) {
		emit(this, eventName, data)
	}

	/* SLOTS API */

	/** @param {string} name */
	hasSlot(name) {
		return this.query(`:scope [slot="${CSS.escape(name)}"]`)
	}

	/**
	 * Returns `true` when the host has at least one default-slotted
	 * child — either a non-whitespace text node, or an element without
	 * a `slot=""` attribute.
	 *
	 * @returns {boolean}
	 */
	hasDefaultSlot() {
		for (const node of this.childNodes) {
			if (node.nodeType === Node.TEXT_NODE) {
				if (/** @type {Text} */ (node).textContent?.trim() !== '')
					return true
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				if (!(/** @type {Element} */ (node).hasAttribute('slot')))
					return true
			}
		}
		return false
	}

	/**
	 * Subscribes to `slotchange` events in the shadow root. When `name`
	 * is provided, only fires for that named `<slot>`; when `name` is
	 * `undefined` it matches the default (unnamed) slot. Returns a
	 * disposer that removes the listener.
	 *
	 * @param {string | undefined} name
	 * @param {(slot: HTMLSlotElement) => void} fn
	 * @returns {() => void}
	 */
	onSlotChange(name, fn) {
		const target = name ?? ''
		const handler = (/** @type {Event} */ e) => {
			const slot = /** @type {HTMLSlotElement} */ (e.target)
			if (slot.name === target) fn(slot)
		}
		this.shadowRoot.addEventListener('slotchange', handler)
		return () =>
			this.shadowRoot.removeEventListener('slotchange', handler)
	}
}
