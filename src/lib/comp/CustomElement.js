import { $customElement } from '../../constants.js'

import { sheet } from '../css/sheet.js'

const cachedSheets = new Map()

export class CustomElement extends HTMLElement {
	[$customElement] = null

	constructor() {
		super()

		this.attachShadow({
			mode: 'open',
		})
	}

	/**
	 * Fires when an attribute or property changes
	 *
	 * @param {string} name - Name of attribute/property
	 * @param {string} value - Value of attribute/property
	 */
	onPropChange(name, value) {}

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
	async addExternalStyles(urls = []) {
		for (const url of urls) {
			let styleSheet = cachedSheets.get(url)
			if (!styleSheet) {
				styleSheet = sheet(await fetch(url).then(r => r.text()))
				cachedSheets.set(url, styleSheet)
			}
			this.addSheet(styleSheet)
		}
	}
}
