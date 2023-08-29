// properties vs attributes

import { effect } from '#main'
import { getValue, hasValue, isFunction } from '#std'

import { NS } from '../constants.js'

// prop

export function setProp(node, name, value, props) {
	setNodeProperty(node, name, value)
}
export function setPropNS(node, name, value, props, localName, ns) {
	setNodeProperty(node, localName, value)
}

// attribute

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

// node properties / attributes

export function setNodeProp(node, name, value, ns) {
	if (isFunction(value)) {
		effect(() => {
			_setNodeProp(node, name, getValue(value), ns)
		})
	} else {
		_setNodeProp(node, name, value, ns)
	}
}
function _setNodeProp(node, name, value, ns) {
	// set as property when boolean
	if (typeof value === 'boolean') {
		_setNodeProperty(node, name, value)
	} else {
		// fallback to attribute when unknown
		_setNodeAttribute(node, name, value, ns)
	}
}

// node properties

function setNodeProperty(node, name, value) {
	if (isFunction(value)) {
		effect(() => {
			_setNodeProperty(node, name, getValue(value))
		})
	} else {
		_setNodeProperty(node, name, value)
	}
}
function _setNodeProperty(node, name, value) {
	// if the value is null or undefined it will be removed
	if (!hasValue(value)) {
		delete node[name]
	} else {
		node[name] = value
	}
}

// node attributes

function setNodeAttribute(node, name, value, ns) {
	if (isFunction(value)) {
		effect(() => {
			_setNodeAttribute(node, name, getValue(value), ns)
		})
	} else {
		_setNodeAttribute(node, name, value, ns)
	}
}
function _setNodeAttribute(node, name, value, ns) {
	// if the value is null or undefined it will be removed
	if (!hasValue(value)) {
		ns && NS[ns]
			? node.removeAttributeNS(NS[ns], name)
			: node.removeAttribute(name)
	} else {
		ns && NS[ns]
			? node.setAttributeNS(NS[ns], name, value)
			: node.setAttribute(name, value)
	}
}
