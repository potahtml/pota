// node style

import { effect } from '#primitives'

import {
	entries,
	getValue,
	isFunction,
	isNotNullObject,
	isNullUndefined,
} from '#std'

/**
 * @param {pota.Element} node
 * @param {string} name
 * @param {unknown} value
 * @param {object} props
 */
export function setStyle(node, name, value, props) {
	setNodeStyle(node.style, value)
}
/**
 * @param {pota.Element} node
 * @param {string} name
 * @param {unknown} value
 * @param {object} props
 * @param {string} localName
 * @param {string} ns
 */
export function setStyleNS(node, name, value, props, localName, ns) {
	setNodeStyle(
		node.style,
		isNotNullObject(value) ? value : { [localName]: value },
	)
}
/**
 * @param {pota.Element} node
 * @param {string} name
 * @param {unknown} value
 * @param {object} props
 * @param {string} localName
 * @param {string} ns
 */
export function setVarNS(node, name, value, props, localName, ns) {
	setNodeStyle(node.style, { ['--' + localName]: value })
}
/**
 * @param {CSSStyleDeclaration} style
 * @param {unknown} value
 */
function setNodeStyle(style, value) {
	if (isNotNullObject(value)) {
		for (const [name, _value] of entries(value))
			setNodeStyleValue(style, name, _value)
		return
	}
	const type = typeof value
	if (type === 'string') {
		style.cssText = value
		return
	}
	if (type === 'function') {
		effect(() => {
			setNodeStyle(style, getValue(value))
		})
		return
	}
}
/**
 * @param {CSSStyleDeclaration} style
 * @param {string} name
 * @param {unknown} value
 */
function setNodeStyleValue(style, name, value) {
	if (isFunction(value)) {
		effect(() => {
			_setNodeStyleValue(style, name, getValue(value))
		})
	} else {
		_setNodeStyleValue(style, name, value)
	}
}
/**
 * @param {CSSStyleDeclaration} style
 * @param {string} name
 * @param {unknown} value
 */
function _setNodeStyleValue(style, name, value) {
	// if the value is null or undefined it will be removed
	if (isNullUndefined(value)) {
		style.removeProperty(name)
	} else {
		style.setProperty(name, value)
	}
}
