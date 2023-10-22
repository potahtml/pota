// properties vs attributes

import { effect } from '#primitives'
import { getValue, isFunction, isNullUndefined } from '#std'

import { NS } from '#constants'

// PROP

/**
 * @param {pota.Element} node
 * @param {string} name
 * @param {unknown} value
 * @param {object} props
 */
export function setProp(node, name, value, props) {
	setNodeProperty(node, name, value)
}
/**
 * @param {pota.Element} node
 * @param {string} name
 * @param {unknown} value
 * @param {object} props
 * @param {string} localName
 * @param {string} ns
 */
export function setPropNS(node, name, value, props, localName, ns) {
	setNodeProperty(node, localName, value)
}

// ATTRIBUTE

/**
 * @param {pota.Element} node
 * @param {string} name
 * @param {unknown} value
 * @param {object} props
 * @param {string} localName
 * @param {string} ns
 */
export function setAttributeNS(
	node,
	name,
	value,
	props,
	localName,
	ns,
) {
	setNodeAttribute(node, localName, value)
}

// NODE PROPERTIES / ATTRIBUTES

/**
 * @param {pota.Element} node
 * @param {string} name
 * @param {unknown} value
 * @param {string} ns
 */
export function setNodeProp(node, name, value, ns) {
	if (isFunction(value)) {
		effect(() => {
			_setNodeProp(node, name, getValue(value), ns)
		})
	} else {
		_setNodeProp(node, name, value, ns)
	}
}
/**
 * @param {pota.Element} node
 * @param {string} name
 * @param {unknown} value
 * @param {string} ns
 */
function _setNodeProp(node, name, value, ns) {
	// set as property when boolean
	if (typeof value === 'boolean') {
		_setNodeProperty(node, name, value)
	} else {
		// fallback to attribute when unknown
		_setNodeAttribute(node, name, value, ns)
	}
}

// NODE PROPERTIES

/**
 * @param {pota.Element} node
 * @param {string} name
 * @param {unknown} value
 */
function setNodeProperty(node, name, value) {
	if (isFunction(value)) {
		effect(() => {
			_setNodeProperty(node, name, getValue(value))
		})
	} else {
		_setNodeProperty(node, name, value)
	}
}
/**
 * @param {pota.Element} node
 * @param {string} name
 * @param {unknown} value
 */
function _setNodeProperty(node, name, value) {
	// if the value is null or undefined it will be removed
	if (isNullUndefined(value)) {
		delete node[name]
	} else {
		node[name] = value
	}
}

// NODE ATTRIBUTES

/**
 * @param {pota.Element} node
 * @param {string} name
 * @param {unknown} value
 * @param {string} [ns]
 */
function setNodeAttribute(node, name, value, ns) {
	if (isFunction(value)) {
		effect(() => {
			_setNodeAttribute(node, name, getValue(value), ns)
		})
	} else {
		_setNodeAttribute(node, name, value, ns)
	}
}
/**
 * @param {pota.Element} node
 * @param {string} name
 * @param {unknown} value
 * @param {string} [ns]
 */
function _setNodeAttribute(node, name, value, ns) {
	// if the value is null or undefined it will be removed
	if (isNullUndefined(value)) {
		ns && NS[ns]
			? node.removeAttributeNS(NS[ns], name)
			: node.removeAttribute(name)
	} else {
		ns && NS[ns]
			? node.setAttributeNS(NS[ns], name, value)
			: node.setAttribute(name, value)
	}
}
