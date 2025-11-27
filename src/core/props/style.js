// node style

import { withValue } from '../../lib/reactive.js'
import { isFunction, isObject, isString } from '../../lib/std.js'

/**
 * Applies style attributes (string/object/function) to an element.
 *
 * @param {DOMElement} node
 * @param {StyleAttribute} value
 * @url https://pota.quack.uy/props/setStyle
 */
export const setStyle = (node, value) => {
	setNodeStyle(node.style, value)
}

/**
 * Applies styles within a namespace (e.g. `style:color` bindings).
 *
 * @param {DOMElement} node
 * @param {string} localName
 * @param {StyleAttribute} value
 */
export const setStyleNS = (node, localName, value) => {
	setNodeStyle(
		node.style,
		isObject(value) ? value : { [localName]: value },
	)
}

/**
 * Normalizes strings/functions/objects into concrete style
 * assignments.
 *
 * @param {CSSStyleDeclaration} style
 * @param {StyleAttribute} value
 */
function setNodeStyle(style, value) {
	if (isString(value)) {
		style.cssText = value
	} else if (isFunction(value)) {
		withValue(value, value => setNodeStyle(style, value))
	} else if (isObject(value)) {
		for (const name in value) {
			setStyleValue(style, name, value[name])
		}
	}
}

/**
 * Sets a single style property, unwrapping reactive values.
 *
 * @param {DOMElement} node
 * @param {string} name
 * @param {unknown} value
 */
export const setElementStyle = (node, name, value) => {
	setStyleValue(node.style, name, value)
}

/**
 * Resolves a possibly reactive style binding before delegating.
 *
 * @param {CSSStyleDeclaration} style
 * @param {string} name
 * @param {unknown} value
 */
const setStyleValue = (style, name, value) => {
	withValue(value, value => _setStyleValue(style, name, value))
}

/**
 * Writes raw styles, removing properties for falsy/nullish values.
 *
 * @param {CSSStyleDeclaration} style
 * @param {string} name
 * @param {unknown} value
 */
const _setStyleValue = (style, name, value) => {
	// if the value is null or undefined it will be removed
	value == null || value === false
		? style.removeProperty(name)
		: style.setProperty(name, /** @type string */ (value))
}
