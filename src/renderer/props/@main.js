import {
	plugins,
	pluginsNS,
	propsPlugin,
	propsPluginNS,
} from './plugin.js'

export { propsPlugin, propsPluginNS }
export { setProperty } from './property.js'
export { setAttribute } from './attribute.js'
export { setBool } from './bool.js'
export { setElementStyle as setStyle } from './style.js'

// styles

import { setStyle, setStyleNS, setVarNS } from './style.js'
propsPlugin('style', setStyle, false)
propsPluginNS('style', setStyleNS, false)
propsPluginNS('var', setVarNS, false)

// class

import { setClass, setClassNS } from './class.js'
propsPlugin('class', setClass, false)
propsPluginNS('class', setClassNS, false)

// forced as properties

import { _setProperty, setProperty } from './property.js'
for (const item of [
	'value',
	'textContent',
	'innerText',
	'innerHTML',
]) {
	propsPlugin(item, setProperty, false)
}

// namespaced

import { setPropertyNS } from './property.js'
propsPluginNS('prop', setPropertyNS, false)

import { setAttributeNS } from './attribute.js'
propsPluginNS('attr', setAttributeNS, false)

import { setBoolNS } from './bool.js'
propsPluginNS('bool', setBoolNS, false)

// life-cycles

import { setOnMount, setUnmount, setRef } from './lifecycles.js'
propsPlugin('onMount', setOnMount, false)
propsPluginNS('onMount', setOnMount, false)

propsPlugin('onUnmount', setUnmount, false)
propsPluginNS('onUnmount', setUnmount, false)

// ref

propsPlugin('ref', setRef, false)
propsPluginNS('ref', setRef, false)

// noop

import { noop } from '../../lib/std/noop.js'

propsPlugin('__dev', noop, false)
propsPlugin('xmlns', noop, false)

// events

import { eventName, addEventListener } from './event.js'
import { setEventNS } from './event.js'
propsPluginNS('on', setEventNS, false)

// catch all

import { setUnknownProp } from './unknown.js'

/**
 * Assigns props to an Element
 *
 * @param {Elements} node - Element to which assign props
 * @param {object} props - Props to assign
 * @param {boolean} [isCustomElement] - Is custom element
 */
export function assignProps(node, props, isCustomElement) {
	let name

	for (name in props) {
		assignProp(node, name, props[name], props, isCustomElement)
	}

	return node
}

import { owned } from '../../lib/reactivity/reactive.js'

import { isObject } from '../../lib/std/isObject.js'

/**
 * Assigns a prop to an Element
 *
 * @param {Elements} node
 * @param {PropertyKey} name
 * @param {any} value
 * @param {object} props
 * @param {boolean} [isCE]
 */
export function assignProp(node, name, value, props, isCE) {
	if (isObject(value) && 'then' in value) {
		value.then(
			owned(value => assignProp(node, name, value, props, isCE)),
		)
		return
	}

	// run plugins
	if (name in plugins) {
		plugins[name](node, name, value, props)
		return
	}

	// onClick={handler}
	let event = eventName(name)
	if (event) {
		addEventListener(node, event, value)
		return
	}

	if (name.includes(':')) {
		// with ns
		let [ns, localName] = name.split(':')

		// run plugins NS
		if (ns in pluginsNS) {
			pluginsNS[ns](node, name, value, props, localName, ns)
			return
		}

		// onClick:my-ns={handler}
		event = eventName(ns)
		if (event) {
			addEventListener(node, event, value)
			return
		}

		isCustomElement(node, props, isCE)
			? _setProperty(node, name, value)
			: setUnknownProp(node, name, value, ns)
		return
	}

	// catch all
	isCustomElement(node, props, isCE)
		? _setProperty(node, name, value)
		: setUnknownProp(node, name, value)
}

const isCustomElement = (node, props, isCustomElement) =>
	// DocumentFragment doesn't have a localName
	isCustomElement !== undefined
		? isCustomElement
		: 'is' in props || node.localName?.includes('-')
