import { $customElement } from '../../constants.js'
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
export function customElement(name, constructor, options = {}) {
	if (customElements.get(name) === undefined) {
		customElements.define(name, constructor, options)
	}
}

const cachedSheets = empty()

export class CustomElement extends HTMLElement {
	[$customElement] = null

	constructor() {
		super()

		this.attachShadow({
			mode: 'open',
		})
	}

	/**
	 * Adds a css string as a sheet to the custom element
	 *
	 * @param {string} css
	 */
	addCSS(css) {
		this.addSheet(sheet(css))
	}
	/**
	 * Adds a style sheet to the custom element
	 *
	 * @param {CSSStyleSheet} sheet
	 */
	addSheet(sheet) {
		this.shadowRoot.adoptedStyleSheets.push(sheet)
	}

	/**
	 * Adds the stylesheet from urls. It uses a cache, to avoid having
	 * to fire a request for each external sheet when used in more than
	 * one custom element. Also, all reference the same object.
	 */
	async addExternalStyles(urls) {
		for (const url of urls) {
			let styleSheet = cachedSheets[url]
			if (!styleSheet) {
				styleSheet = sheet(await fetch(url).then(r => r.text()))
				cachedSheets[url] = styleSheet
			}
			this.addSheet(styleSheet)
		}
	}
}
