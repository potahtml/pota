import { empty, entries, microtask } from '../../lib/std/@main.js'
import { withOwner } from '../../lib/reactivity/primitives/solid.js'

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
 *
 * @param {boolean} [runOnMicrotask=true] - To avoid the problem of
 *   needed props not being set, or children elements not created yet.
 *   Default is `true`
 */
export const propsPlugin = (propName, fn, runOnMicrotask = true) => {
	plugin(properties, propName, fn, runOnMicrotask)
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
 *
 * @param {boolean} [runOnMicrotask=true] - To avoid the problem of
 *   needed props not being set, or children elements not created yet.
 *   Default is `true`
 */
export const propsPluginNS = (NSName, fn, runOnMicrotask = true) => {
	plugin(propertiesNS, NSName, fn, runOnMicrotask)
}

const plugin = (object, name, fn, runOnMicrotask) => {
	object[name] = !runOnMicrotask
		? fn
		: (...args) => {
				const owned = withOwner()
				microtask(() => owned(() => fn(...args)))
			}
}

// styles

import { setStyle } from './style.js'
propsPlugin('style', setStyle, false)

import { setStyleNS, setVarNS } from './style.js'
propsPluginNS('style', setStyleNS, false)
propsPluginNS('var', setVarNS, false)

// class

import { setClass } from './class.js'
propsPlugin('class', setClass, false)

import { setClassNS } from './class.js'
propsPluginNS('class', setClassNS, false)

// properties

import { setProp } from './attribute-property.js'
;['innerHTML', 'textContent', 'value', 'innerText'].forEach(item =>
	propsPlugin(item, setProp, false),
)

import { setPropNS, setAttributeNS } from './attribute-property.js'
propsPluginNS('prop', setPropNS, false)
propsPluginNS('attr', setAttributeNS, false)

// life-cycles

import { setOnMount, setUnmount } from './lifecycles.js'
propsPlugin('onMount', setOnMount, false)
propsPlugin('onUnmount', setUnmount, false)

propsPluginNS('onMount', setOnMount, false)
propsPluginNS('onUnmount', setUnmount, false)

// ref

propsPlugin('ref', setOnMount, false)
propsPluginNS('ref', setOnMount, false)

// events

import { eventName, setEventNS, addEventListener } from './event.js'
propsPluginNS('on', setEventNS, false)

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

export {
	setNodeProperty as setElementProperty,
	setNodeAttribute as setElementAttribute,
} from './attribute-property.js'

export { setElementStyle } from './style.js'
