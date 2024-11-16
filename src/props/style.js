// node style

import { withValue } from '../lib/reactive.js'
import { getValue, isNullUndefined, isObject } from '../lib/std.js'

/**
 * @param {Element} node
 * @param {string} name
 * @param {unknown} value
 * @param {object} props
 * @url https://pota.quack.uy/props/setStyle
 */
export const setStyle = (node, name, value, props) =>
	setNodeStyle(node.style, value)

/**
 * @param {Element} node
 * @param {string} name
 * @param {unknown} value
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
 * @param {Element} node
 * @param {string} name
 * @param {unknown} value
 * @param {object} props
 * @param {string} localName
 * @param {string} ns
 */
export const setVarNS = (node, name, value, props, localName, ns) =>
	setNodeStyle(node.style, { ['--' + localName]: value })

/**
 * @param {CSSStyleDeclaration} style
 * @param {unknown} value
 */
function setNodeStyle(style, value) {
	if (isObject(value)) {
		for (const name in value) {
			setStyleValue(style, name, value[name])
		}
		return
	}
	const type = typeof value
	if (type === 'string') {
		style.cssText = value
		return
	}
	if (type === 'function') {
		withValue(value, value => setNodeStyle(style, getValue(value)))
		return
	}
}

/**
 * @param {Element} node
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
