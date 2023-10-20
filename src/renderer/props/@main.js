import { empty, entries } from '#std'

const properties = empty()
const propertiesNS = empty()

/**
 * Registers a prop that can be used on any JSX Element
 *
 * @param {string} propName - Name of the prop
 * @param {(
 * 	node: pota.element,
 * 	propName: string,
 * 	propValue: Function | unknown,
 * 	props: object,
 * ) => void} fn
 *   - Function to run when this prop is found on a JSX Element
 */
export function registerProp(propName, fn) {
	properties[propName] = fn
}

/**
 * Registers a namespaced prop that can be used on any JSX Element
 *
 * @param {string} NSName - Name of the namespace
 * @param {(
 * 	node: pota.element,
 * 	propName: string,
 * 	propValue: Function | unknown,
 * 	props: object,
 * 	localName: string,
 * 	ns: string,
 * ) => void} fn
 *   - Function to run when this prop is found on a JSX Element
 */
export function registerPropNS(NSName, fn) {
	propertiesNS[NSName] = fn
}

// styles

import { setStyle } from './style.js'
registerProp('style', setStyle)

import { setStyleNS, setVarNS } from './style.js'
registerPropNS('style', setStyleNS)
registerPropNS('var', setVarNS)

// class

import { setClass } from './class.js'
registerProp('class', setClass)

import { setClassNS } from './class.js'
registerPropNS('class', setClassNS)

// properties

import { setProp } from './attribute-property.js'
registerProp('innerHTML', setProp)
registerProp('textContent', setProp)
registerProp('value', setProp)
registerProp('innerText', setProp)

import { setPropNS, setAttributeNS } from './attribute-property.js'
registerPropNS('prop', setPropNS)
registerPropNS('attr', setAttributeNS)

// life-cycles

import { setOnMount, setOnCleanup } from './lifecycles.js'
registerProp('onMount', setOnMount)
registerProp('onCleanup', setOnCleanup)

registerPropNS('onMount', setOnMount)
registerPropNS('onCleanup', setOnCleanup)

// events

import { eventName, setEventNS, addEventListener } from './event.js'
registerPropNS('on', setEventNS)

// catch all

import { setNodeProp } from './attribute-property.js'

/**
 * Assigns props to an Element
 *
 * @param {pota.element} node - Element to which assign props
 * @param {object} props - Props to assign
 */
export function assignProps(node, props) {
	for (const [name, value] of entries(props)) {
		// internal props
		if (name === 'children' || name === 'mount' || name === '$data')
			continue

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
