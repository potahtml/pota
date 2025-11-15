// node style

import { withValue } from '../../lib/reactive.js'
import { isFunction, isObject, isString } from '../../lib/std.js'

/**
 * @param {DOMElement} node
 * @param {StyleAttribute} value
 * @url https://pota.quack.uy/props/setStyle
 */
export const setStyle = (node, value) => {
	setNodeStyle(node.style, value)
}

/**
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
 * @param {DOMElement} node
 * @param {string} name
 * @param {unknown} value
 */
export const setElementStyle = (node, name, value) => {
	setStyleValue(node.style, name, value)
}

/**
 * @param {CSSStyleDeclaration} style
 * @param {string} name
 * @param {unknown} value
 */
const setStyleValue = (style, name, value) => {
	withValue(value, value => _setStyleValue(style, name, value))
}

/**
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
