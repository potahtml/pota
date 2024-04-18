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

// events

import { eventName, addEventListener } from './event.js'
import { setEventNS } from './event.js'
propsPluginNS('on', setEventNS, false)

// catch all

import { setUnknownProp } from './unknown.js'

const isCustomElement = (node, props) =>
	// document-fragment wont have a localName
	'is' in props || node.localName?.includes('-')

/**
 * Assigns props to an Element
 *
 * @param {Elements} node - Element to which assign props
 * @param {object} props - Props to assign
 */
export function assignProps(node, props) {
	let name
	let value

	for (name in props) {
		value = props[name]

		// run plugins
		if (name in plugins) {
			plugins[name](node, name, value, props)
			continue
		}

		// onClick={handler}
		let event = eventName(name)
		if (event) {
			addEventListener(node, event, value)
			continue
		}

		if (name.includes(':')) {
			// with ns
			let [ns, localName] = name.split(':')

			// run plugins NS
			if (ns in pluginsNS) {
				pluginsNS[ns](node, name, value, props, localName, ns)
				continue
			}

			// onClick:my-ns={handler}
			event = eventName(ns)
			if (event) {
				addEventListener(node, event, value)
				continue
			}

			isCustomElement(node, props)
				? _setProperty(node, name, value)
				: setUnknownProp(node, name, value, ns)
			continue
		}

		// catch all
		isCustomElement(node, props)
			? _setProperty(node, name, value)
			: setUnknownProp(node, name, value)
	}
}
