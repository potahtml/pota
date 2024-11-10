// NODE UNKNOWN PROPERTIES / ATTRIBUTES

import { withValue } from '../lib/reactive.js'
import {
	getPrototypeOf,
	getSetterNamesFromPrototype,
} from '../lib/std.js'
import { setAttribute } from './attribute.js'
import { setProperty } from './property.js'

/**
 * @param {Element} node
 * @param {string} name
 * @param {unknown} value
 * @param {string} [ns]
 */
export const setUnknown = (node, name, value, ns) => {
	withValue(value, value => _setUnknown(node, name, value, ns))
}

/**
 * @param {Element} node
 * @param {string} name
 * @param {unknown} value
 * @param {string} [ns]
 */
export const _setUnknown = (node, name, value, ns) => {
	const setters = elementSetters(node)

	if (
		setters.element.has(name) &&
		(typeof value !== 'string' || node.isCustomElement)
	) {
		/**
		 * 1. Only do this when it's different to a string to avoid coarcing
		 *    on native elements (ex: (img.width = '16px') === 0)
		 * 2. Or when a custom element has a setter
		 */
		setProperty(node, name, value)
	} else if (setters.builtIn.has(name)) {
		// ex: innerHTML, textContent, draggable={true}
		setProperty(node, name, value)
	} else {
		setAttribute(node, name, value, ns)
	}
}

const elements = new Map()

/** @param {Element} node */
function elementSetters(node) {
	/**
	 * Use `node.constructor` instead of `node.nodeName` because it
	 * handles the difference between `a` `HTMLAnchorElement` and `a`
	 * `SVGAElement`
	 */
	let setters = elements.get(node.constructor)
	if (setters) return setters
	setters = { builtIn: new Set(builtInSetters), element: new Set() }
	elements.set(node.constructor, setters)

	let store = setters.element
	let proto = getPrototypeOf(node)

	/**
	 * Stop at `Element` instead of `HTMLElement` because it handles the
	 * difference between `HTMLElement`, `SVGElement`, `FutureElement`
	 * etc
	 */
	while (proto.constructor !== Element) {
		const nextProto = getPrototypeOf(proto)

		/**
		 * The previous prototype to `Element` is a `builtIn`
		 * (`HTMLElement`, `SVGElement`,`FutureElement`, etc)
		 */
		if (nextProto.constructor === Element) {
			store = setters.builtIn
		}
		getSetterNamesFromPrototype(proto, store)
		proto = nextProto
	}

	return setters
}

/** Setters shared by all kind of elements */
const builtInSetters = getSetterNamesFromPrototype(
	Element.prototype,
	getSetterNamesFromPrototype(Node.prototype),
)
