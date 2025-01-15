import {
	addStyleSheets,
	emit,
	isString,
	querySelector,
	removeAttribute,
	setAttribute,
} from '../lib/std.js'

import { Component, toHTMLFragment } from '../renderer.js'

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
	constructor() {
		super()

		const shadowRoot = this.attachShadow({
			mode: 'open',
		})

		// this is needed because `baseStyleSheets/styleSheets` are `static`
		const constructor = this.constructor

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

	hasSlot(name) {
		return this.query(`:scope [slot="${name}"]`)
	}
}
