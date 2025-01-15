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
export { setUnknown } from './unknown.js'
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

// noop

import { empty, noop } from '../lib/std.js'
propsPlugin('__dev', noop, false)
propsPlugin('xmlns', noop, false)

// value

import { setValue } from './value.js'
propsPlugin('value', setValue, false)

import { setProperty } from './property.js'
propsPlugin('textContent', setProperty, false)

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

const propNS = empty()

/**
 * Assigns a prop to an Element
 *
 * @param {Element} node
 * @param {string} name
 * @param {any} value
 * @param {object} props
 */
export function assignProp(node, name, value, props) {
	// run plugins
	let plugin = plugins.get(name)
	if (plugin) {
		plugin(node, name, value, props)
	} else if (propNS[name] || name.includes(':')) {
		// with ns
		propNS[name] = propNS[name] || name.split(':')
		const [ns, localName] = propNS[name]

		// run plugins NS
		plugin = pluginsNS.get(ns)
		plugin
			? plugin(node, name, value, props, localName, ns)
			: setUnknown(node, name, value, ns)
	} else {
		// catch all
		setUnknown(node, name, value)
	}
}
