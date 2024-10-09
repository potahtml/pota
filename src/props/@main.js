import {
	addEventListener,
	owned,
	ownedEvent,
} from '../lib/reactive.js'
import { getValue, isObject } from '../lib/std.js'

import { eventName } from './event.js'

import {
	plugins,
	pluginsNS,
	propsPlugin,
	propsPluginBoth,
	propsPluginNS,
} from './plugin.js'
import { setUnknown } from './unknown.js'

// exports

export { setAttribute } from './attribute.js'
export { setBool } from './bool.js'
export { setProperty } from './property.js'
export { setElementStyle as setStyle } from './style.js'
export { setElementClass as setClass } from './class.js'

// PLUGINS NS

// namespaced attributes/properties

import { setPropertyNS } from './property.js'
propsPluginNS('prop', setPropertyNS, false)

import { setAttributeNS } from './attribute.js'
propsPluginNS('attr', setAttributeNS, false)

import { setBoolNS } from './bool.js'
propsPluginNS('bool', setBoolNS, false)

// events

import { setEventNS } from './event.js'
propsPluginNS('on', setEventNS, false)

// var

import { setVarNS } from './style.js'
propsPluginNS('var', setVarNS, false)

// PLUGINS REGULAR

// forced as properties

import { setProperty } from './property.js'
for (const item of [
	'value',
	'textContent',
	'innerText',
	'innerHTML',
]) {
	propsPlugin(item, setProperty, false)
}

// noop

import { noop } from '../lib/std.js'
propsPlugin('__dev', noop, false)
propsPlugin('xmlns', noop, false)

// PLUGIN BOTH

// css

import { setCSS } from './css.js'
propsPluginBoth('css', setCSS, false)

// mount

import { setOnMount } from './lifecycle.js'
propsPluginBoth('onMount', setOnMount, false)

// unmount

import { setUnmount } from './lifecycle.js'
propsPluginBoth('onUnmount', setUnmount, false)

// ref

import { setRef } from './lifecycle.js'
propsPluginBoth('ref', setRef, false)

// PLUGIN BOTH DIFFERENT

// styles

import { setStyle, setStyleNS } from './style.js'
propsPlugin('style', setStyle, false)
propsPluginNS('style', setStyleNS, false)

// class

import { setClass, setClassNS } from './class.js'
propsPlugin('class', setClass, false)
propsPluginNS('class', setClassNS, false)

// catch all

/**
 * Assigns props to an Element
 *
 * @param {Element} node - Element to which assign props
 * @param {object} props - Props to assign
 */
export function assignProps(node, props) {
	for (const name in props) {
		assignProp(node, name, props[name], props)
	}
}

/**
 * Assigns a prop to an Element
 *
 * @param {Element} node
 * @param {string} name
 * @param {any} value
 * @param {object} props
 */
export function assignProp(node, name, value, props) {
	// unwrap promises
	if (isObject(value) && 'then' in value) {
		value.then(
			owned(value => assignProp(node, name, getValue(value), props)),
		)
		return
	}

	// run plugins
	let plugin = plugins.get(name)
	if (plugin) {
		plugin(node, name, value, props)
		return
	}

	// onClick={handler}
	let event = eventName(name)
	if (event) {
		// `value &&` for when `onClick={handler}` and `handler` is undefined
		value && addEventListener(node, event, ownedEvent(value))
		return
	}

	if (name.includes(':')) {
		// with ns
		const [ns, localName] = name.split(':')

		// run plugins NS
		plugin = pluginsNS.get(ns)
		if (plugin) {
			plugin(node, name, value, props, localName, ns)
			return
		}

		// onClick:my-ns={handler}
		event = eventName(ns)
		if (event) {
			// `value &&` for when `onClick={handler}` and `handler` is undefined
			value && addEventListener(node, event, ownedEvent(value))
			return
		}

		setUnknown(node, name, value, ns)
		return
	}

	// catch all
	setUnknown(node, name, value)
}
