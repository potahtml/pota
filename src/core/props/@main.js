import { empty } from '../../lib/std.js'

import {
	plugins,
	pluginsNS,
	propsPlugin,
	propsPluginNS,
} from './plugin.js'

// PLUGINS NS

// properties

import { setPropertyNS } from './property.js'
propsPluginNS('prop', setPropertyNS, false)

// events

import { setEventNS } from './event.js'
propsPluginNS('on', setEventNS, false)

// PLUGIN BOTH

// css

import { setCSS } from './css.js'
propsPlugin('use:css', setCSS, false)

// mount

import { setConnected } from './lifecycle.js'
propsPlugin('use:connected', setConnected, false)

// unmount

import { setDisconnected } from './lifecycle.js'
propsPlugin('use:disconnected', setDisconnected, false)

// ref

import { setRef } from './lifecycle.js'
propsPlugin('use:ref', setRef, false)

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

const propNS = empty()

import { setAttribute, setAttributeNS } from './attribute.js'

/**
 * Assigns props to an Element
 *
 * @template T
 * @param {Element} node - Element to which assign props
 * @param {T} props - Props to assign
 */
export function assignProps(node, props) {
	for (const name in props) {
		assignProp(node, name, props[name])
	}
}

/**
 * Assigns a prop to an Element
 *
 * @template T
 * @param {Element} node
 * @param {string} name
 * @param {any} value
 */
export function assignProp(node, name, value) {
	// run plugins
	let plugin = plugins.get(name)
	if (plugin) {
		plugin(node, value)
	} else if (propNS[name] || name.includes(':')) {
		// with ns
		propNS[name] = propNS[name] || name.split(':')

		// run plugins NS
		plugin = pluginsNS.get(propNS[name][0])
		plugin
			? plugin(node, propNS[name][1], value)
			: setAttributeNS(node, name, value, propNS[name][0])
	} else {
		// catch all
		setAttribute(node, name, value)
	}
}

/**
 * Assigns a prop to an Element
 *
 * @template T
 * @param {Element} node
 * @param {string} name
 * @param {any} value
 * @param {string} localName
 * @param {string} ns
 */
export function assignPropNS(node, name, value, localName, ns) {
	// run plugins NS
	let plugin = plugins.get(name)
	if (plugin) {
		plugin(node, value)
	} else {
		plugin = pluginsNS.get(ns)
		plugin
			? plugin(node, localName, value)
			: setAttributeNS(node, name, value, ns)
	}
}
