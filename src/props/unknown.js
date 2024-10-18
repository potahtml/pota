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
	if (typeof value !== 'string' && setters(node).element.has(name)) {
		/**
		 * 1. First check in element because a custom-element may overwrite
		 *    builtIn setters
		 * 2. Only do this when it's different to a string to avoid coarcing
		 *    on native elements (ex: (img.width = '16px') === 0)
		 */
		setProperty(node, name, value)
	} else if (setters(node).builtIn.has(name)) {
		// ex: innerHTML, textContent, draggable={true}
		setProperty(node, name, value)
	} else {
		setAttribute(node, name, value, ns)
	}
}

const elements = new Map()

/** @param {Element} node */
function setters(node) {
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
