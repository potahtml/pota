// node style

import { effect } from '../../lib/reactivity/reactive.js'

import { withValue } from './withValue.js'

import {
	getValue,
	isObject,
	isNullUndefined,
} from '../../lib/std/@main.js'

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 * @param {object} props
 * @url https://pota.quack.uy/props/setStyle
 */
export const setStyle = (node, name, value, props) =>
	setNodeStyle(node.style, value)

/**
 * @param {Elements} node
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
 * @param {Elements} node
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
		let name
		for (name in value) {
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
		effect(() => setNodeStyle(style, getValue(value)))
		return
	}
}

/**
 * @param {Elements} node
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
	withValue(name, value, value => _setStyleValue(style, name, value))

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
