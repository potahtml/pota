import {
	Component,
	toHTMLFragment,
} from '../../renderer/@renderer.js'
import { sheet } from '../css/sheet.js'
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

		const element = this.constructor

		// add external sheet
		this.addStyleSheetExternal(element.styleSheets)

		// add local sheet
		this.addStyleSheet(element.styleSheet)

		// add component
		this.shadowRoot.append(
			toHTMLFragment(
				Component(this.component || element.component || 'slot'),
			),
		)
	}

	/**
	 * Shortcut for shadowRoot.innerHTML
	 *
	 * @param {string} value
	 */
	set html(value) {
		this.shadowRoot.innerHTML = value
	}

	/* CSS API */

	/**
	 * Adds a style sheet to the custom element
	 *
	 * @param {CSSStyleSheet} sheet
	 */
	addStyleSheet(sheet) {
		sheet && this.shadowRoot.adoptedStyleSheets.push(sheet)
	}

	/**
	 * Adds the stylesheet from urls. It uses a cache, to avoid having
	 * to fire a request for each external sheet when used in more than
	 * one custom element. Also, all reference the same object.
	 */
	addStyleSheetExternal(urls = []) {
		for (const url of urls) {
			const styleSheet = cachedSheets[url]
			!styleSheet
				? fetch(url)
						.then(r => r.text())
						.then(css => sheet(css))
						.then(styleSheet => {
							cachedSheets[url] = styleSheet
							this.addStyleSheet(styleSheet)
						})
				: this.addStyleSheet(styleSheet)
		}
	}
}
