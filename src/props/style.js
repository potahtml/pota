// node style

import { withValue } from '../lib/reactive.js'
import {
	getValue,
	isFunction,
	isNullUndefined,
	isObject,
	isString,
} from '../lib/std.js'

/**
 * @param {DOMElement} node
 * @param {string} name
 * @param {StylePropertyValue} value
 * @param {object} props
 * @url https://pota.quack.uy/props/setStyle
 */
export const setStyle = (node, name, value, props) =>
	setNodeStyle(node.style, value)

/**
 * @param {DOMElement} node
 * @param {string} name
 * @param {StylePropertyValue} value
 * @param {object} props
 * @param {string} localName
 * @param {string} ns
 */
export const setStyleNS = (node, name, value, props, localName, ns) =>
	setNodeStyle(
		node.style,
		isObject(value) ? value : { [localName]: value },
	)

/**
 * @param {DOMElement} node
 * @param {string} name
 * @param {StylePropertyValue} value
 * @param {object} props
 * @param {string} localName
 * @param {string} ns
 */
export const setVarNS = (node, name, value, props, localName, ns) =>
	setNodeStyle(node.style, { ['--' + localName]: value })

/**
 * @param {CSSStyleDeclaration} style
 * @param {StylePropertyValue} value
 */
function setNodeStyle(style, value) {
	if (isString(value)) {
		style.cssText = value
	} else if (isFunction(value)) {
		withValue(value, value => setNodeStyle(style, getValue(value)))
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
export const setElementStyle = (node, name, value) =>
	setStyleValue(node.style, name, value)

/**
 * @param {CSSStyleDeclaration} style
 * @param {string} name
 * @param {unknown} value
 */
const setStyleValue = (style, name, value) =>
	withValue(value, value => _setStyleValue(style, name, value))

/**
 * @param {CSSStyleDeclaration} style
 * @param {string} name
 * @param {string | null} value
 */
const _setStyleValue = (style, name, value) =>
	// if the value is null or undefined it will be removed
	isNullUndefined(value)
		? style.removeProperty(name)
		: style.setProperty(name, value)
