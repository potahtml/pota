import { $webElement } from '../../constants.js'

export class WebElement extends HTMLElement {
	[$webElement] = null
	/**
	 * Fires when an attribute or property changes
	 *
	 * @param {string} name - Name of attribute/property
	 * @param {string} value - Value of attribute/property
	 */
	onPropChange(name, value) {}
}
