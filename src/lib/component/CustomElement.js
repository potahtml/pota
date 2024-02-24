import {
	Component,
	toHTMLFragment,
} from '../../renderer/@main.js'
import { sheet } from '../css/sheet.js'
import { emit } from '../events/emit.js'
import { withValue } from '../reactivity/withValue.js'
import { empty } from '../std/empty.js'

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

const cachedSheets = empty()

export class CustomElement extends HTMLElement {
	constructor() {
		super()

		this.attachShadow({
			mode: 'open',
		})

		this.addStyleSheets(this.constructor.styleSheets)
	}

	/* CSS API */

	/**
	 * Adds a style sheet to the custom element
	 *
	 * @param {(CSSStyleSheet | string)[]} styleSheets
	 */
	addStyleSheets(styleSheets = []) {
		for (const sheet of styleSheets) {
			sheet instanceof CSSStyleSheet
				? this.shadowRoot.adoptedStyleSheets.push(sheet)
				: this.addStyleSheetExternal(sheet)
		}
	}

	/**
	 * Adds the stylesheet from urls. It uses a cache, to avoid having
	 * to fire a request for each external sheet when used in more than
	 * one custom element. Also, all reference the same object.
	 *
	 * @param {string} url
	 */
	addStyleSheetExternal(url) {
		const styleSheet = cachedSheets[url]
		!styleSheet
			? fetch(url)
					.then(r => r.text())
					.then(css => sheet(css))
					.then(styleSheet => {
						cachedSheets[url] = styleSheet
						this.addStyleSheets([styleSheet])
					})
			: this.addStyleSheets([styleSheet])
	}

	/* DOM API */

	/**
	 * Shortcut for querySelector
	 *
	 * @param {string} query
	 */
	query(query) {
		return this.querySelector(query)
	}
	/**
	 * Shortcut for this.shadowRoot.innerHTML
	 *
	 * @param {string} value
	 */
	set html(value) {
		if (typeof value === 'string') {
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
		withValue(value, value => {
			value
				? this.setAttribute('hidden', '')
				: this.removeAttribute('hidden')
		})
	}

	/* EVENTS API */

	emit(eventName, data) {
		emit(this, eventName, data)
	}

	/* SLOTS API */

	hasSlot(name) {
		return this.query(`:scope > [slot="${name}"]`) !== null
	}
}
