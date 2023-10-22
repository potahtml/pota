// node class / classList

import { effect } from '#primitives'
import { entries, getValue, isFunction, isNotNullObject } from '#std'

/**
 * @param {pota.Element} node
 * @param {string} name
 * @param {unknown} value
 * @param {object} props
 */
export function setClass(node, name, value, props) {
	setNodeClassList(node.classList, value)
}
/**
 * @param {pota.Element} node
 * @param {string} name
 * @param {unknown} value
 * @param {object} props
 * @param {string} localName
 * @param {string} ns
 */
export function setClassNS(node, name, value, props, localName, ns) {
	setNodeClassList(
		node.classList,
		isNotNullObject(value) ? value : { [localName]: value },
	)
}

// todo: the name of the class is not reactive

/**
 * @param {DOMTokenList} classList
 * @param {unknown | string | ArrayLike<any>} value
 */
function setNodeClassList(classList, value) {
	if (isNotNullObject(value)) {
		for (const [name, _value] of entries(value))
			setNodeClassListValue(classList, name, _value)
		return
	}
	const type = typeof value

	if (type === 'string') {
		setNodeClassListValue(classList, value, true)
		return
	}
	if (type === 'function') {
		effect(() => {
			setNodeClassList(classList, getValue(value))
		})
		return
	}
}
/**
 * @param {DOMTokenList} classList
 * @param {string} name
 * @param {unknown} value
 */
function setNodeClassListValue(classList, name, value) {
	if (isFunction(value)) {
		effect(() => {
			_setNodeClassListValue(classList, name, getValue(value))
		})
	} else {
		_setNodeClassListValue(classList, name, value)
	}
}
/**
 * @param {DOMTokenList} classList
 * @param {string} name
 * @param {unknown} value
 */
function _setNodeClassListValue(classList, name, value) {
	// null, undefined or false the class is removed
	if (!value) {
		classList.remove(name)
	} else {
		classList.add(...name.trim().split(/\s+/))
	}
}
