import { empty, entries } from '#std'

const properties = empty()
const propertiesNS = empty()

/**
 * Defines a prop that can be used on any JSX Element
 *
 * @param {string} propName - Name of the prop
 * @param {(
 * 	node: pota.Element,
 * 	propName: string,
 * 	propValue: Function | unknown,
 * 	props: object,
 * ) => void} fn
 *   - Function to run when this prop is found on a JSX Element
 */
export function propDefine(propName, fn) {
	properties[propName] = fn
}

/**
 * Defines a namespaced prop that can be used on any JSX Element
 *
 * @param {string} NSName - Name of the namespace
 * @param {(
 * 	node: pota.Element,
 * 	propName: string,
 * 	propValue: Function | unknown,
 * 	props: object,
 * 	localName: string,
 * 	ns: string,
 * ) => void} fn
 *   - Function to run when this prop is found on a JSX Element
 */
export function propDefineNS(NSName, fn) {
	propertiesNS[NSName] = fn
}

// styles

import { setStyle } from './style.js'
propDefine('style', setStyle)

import { setStyleNS, setVarNS } from './style.js'
propDefineNS('style', setStyleNS)
propDefineNS('var', setVarNS)

// class

import { setClass } from './class.js'
propDefine('class', setClass)

import { setClassNS } from './class.js'
propDefineNS('class', setClassNS)

// properties

import { setProp } from './attribute-property.js'
propDefine('innerHTML', setProp)
propDefine('textContent', setProp)
propDefine('value', setProp)
propDefine('innerText', setProp)

import { setPropNS, setAttributeNS } from './attribute-property.js'
propDefineNS('prop', setPropNS)
propDefineNS('attr', setAttributeNS)

// life-cycles

import { setOnMount, setUnmount } from './lifecycles.js'
propDefine('onMount', setOnMount)
propDefine('onUnmount', setUnmount)

propDefineNS('onMount', setOnMount)
propDefineNS('onUnmount', setUnmount)

// events

import { eventName, setEventNS, addEventListener } from './event.js'
propDefineNS('on', setEventNS)

// catch all

import { setNodeProp } from './attribute-property.js'

/**
 * Assigns props to an Element
 *
 * @param {pota.Element} node - Element to which assign props
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
