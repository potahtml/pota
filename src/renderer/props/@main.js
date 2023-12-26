import { empty, entries } from '../../lib/std/@main.js'

const properties = empty()
const propertiesNS = empty()

/**
 * Defines a prop that can be used on any JSX Element
 *
 * @param {string} propName - Name of the prop
 * @param {(
 * 	node: Elements,
 * 	propName: string,
 * 	propValue: Function | any,
 * 	props: object,
 * ) => void} fn
 *   - Function to run when this prop is found on a JSX Element
 */
export const propsPlugin = (propName, fn) => {
	properties[propName] = fn
}

/**
 * Defines a namespaced prop that can be used on any JSX Element
 *
 * @param {string} NSName - Name of the namespace
 * @param {(
 * 	node: Elements,
 * 	propName: string,
 * 	propValue: Function | any,
 * 	props: object,
 * 	localName: string,
 * 	ns: string,
 * ) => void} fn
 *   - Function to run when this prop is found on a JSX Element
 */
export const propsPluginNS = (NSName, fn) => {
	propertiesNS[NSName] = fn
}

// styles

import { setStyle } from './style.js'
propsPlugin('style', setStyle)

import { setStyleNS, setVarNS } from './style.js'
propsPluginNS('style', setStyleNS)
propsPluginNS('var', setVarNS)

// class

import { setClass } from './class.js'
propsPlugin('class', setClass)

import { setClassNS } from './class.js'
propsPluginNS('class', setClassNS)

// properties

import { setProp } from './attribute-property.js'
;['innerHTML', 'textContent', 'value', 'innerText'].forEach(item =>
	propsPlugin(item, setProp),
)

import { setPropNS, setAttributeNS } from './attribute-property.js'
propsPluginNS('prop', setPropNS)
propsPluginNS('attr', setAttributeNS)

// life-cycles

import { setOnMount, setUnmount } from './lifecycles.js'
propsPlugin('onMount', setOnMount)
propsPlugin('onUnmount', setUnmount)

propsPluginNS('onMount', setOnMount)
propsPluginNS('onUnmount', setUnmount)

// ref

propsPlugin('ref', setOnMount)
propsPluginNS('ref', setOnMount)

// events

import {
	eventName,
	setEventNS,
	addEventListener,
	bindValue,
} from './event.js'
propsPluginNS('on', setEventNS)

// bind

propsPlugin('bind', bindValue)
propsPluginNS('bind', bindValue)

// catch all

import { setNodeProp } from './attribute-property.js'

/**
 * Assigns props to an Element
 *
 * @param {Elements} node - Element to which assign props
 * @param {object} props - Props to assign
 */
export function assignProps(node, props) {
	for (const [name, value] of entries(props)) {
		// internal props
		if (name === 'children') continue

		// run plugins
		if (properties[name]) {
			properties[name](node, name, value, props)
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
		if (propertiesNS[ns]) {
			propertiesNS[ns](node, name, value, props, localName, ns)
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
		setNodeProp(node, name, value, ns)
	}
}
