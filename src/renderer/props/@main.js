import { entries } from '../../lib/std/@main.js'

import {
	plugins,
	pluginsNS,
	propsPlugin,
	propsPluginNS,
} from './plugin.js'

export { propsPlugin, propsPluginNS }
export { propsProxy } from './proxy.js'
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

import { setProperty } from './property.js'
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

import { setEventNS } from './event.js'
propsPluginNS('on', setEventNS, false)

// catch all

import { setUnknownProp } from './unknown.js'
import { eventName, addEventListener } from './event.js'

// proxy

import { hasProxy, proxy } from './proxy.js'

/**
 * Assigns props to an Element
 *
 * @param {Elements} node - Element to which assign props
 * @param {object} props - Props to assign
 */
export function assignProps(node, props) {
	for (let [name, value] of entries(props)) {
		// internal props
		if (name === 'children') continue

		// run proxies
		if (hasProxy.value) {
			;({ name, value } = proxy(name, value))
		}

		// run plugins
		if (plugins[name]) {
			plugins[name](node, name, value, props)
			continue
		}

		// onClick={handler}
		let event = eventName(name)
		if (event) {
			// delegated: yes
			addEventListener(node, event, value, true, false)
			continue
		}

		// with ns
		const [ns, localName] =
			name.indexOf(':') !== -1 ? name.split(':') : ['', name]

		// run plugins NS
		if (pluginsNS[ns]) {
			pluginsNS[ns](node, name, value, props, localName, ns)
			continue
		}

		// onClick:my-ns={handler}
		event = eventName(ns)
		if (event) {
			// delegated: yes
			addEventListener(node, event, value, true, false)
			continue
		}

		// catch all
		setUnknownProp(node, name, value, ns)
	}
}
