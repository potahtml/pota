// events
// delegated and native events are hold into an array property of the node
// to avoid duplicated events that could be added by using `ns` in ease of organization

import { cleanup } from '../../lib/reactivity/primitives/solid.js'
import {
	defineProperty,
	empty,
	isArray,
	property,
	removeFromArray,
} from '../../lib/std/@main.js'
import { $meta } from '../../constants.js'

/**
 * @param {Elements} node
 * @param {string} name
 * @param {Handler} value
 * @param {object} props
 * @param {string} localName
 * @param {string} ns
 */
export const setEventNS = (node, name, value, props, localName, ns) =>
	// delegated: no
	addEventListener(node, localName, value, false, false)

const EventNames = empty()

/**
 * Returns an event name when the string could be mapped to an event
 *
 * @param {string} name - String to check for a mapped event
 * @returns {string | null} Returns the event name or null in case
 *   isnt found
 */
export function eventName(name) {
	if (name in EventNames) {
		return EventNames[name]
	}

	if (
		name.startsWith('on') &&
		window[name.toLowerCase()] !== undefined
	) {
		EventNames[name] = name.slice(2).toLowerCase()
	} else {
		if (/^on[A-Z]/.test(name)) {
			console.warn(
				'pota: warn:',
				name,
				'not found as an event listener on `window`',
			)
		}
		EventNames[name] = null
	}
	return EventNames[name]
}

const Delegated = empty()

/**
 * Adds an event listener to a node
 *
 * @param {Elements} node - Element to add the event listener
 * @param {string} type - The name of the event listener
 * @param {Handler} handler - Function to handle the event
 * @param {boolean} [delegated] - To choose delegation or not. Default
 *   is `true`
 * @param {boolean} [external] - External defaults to true and avoids
 *   returning an `off` function for the event listener
 * @returns {Function | void} - An `off` function for removing the
 *   event listener
 */
export function addEventListener(
	node,
	type,
	handler,
	delegated = true,
	external = true,
) {
	const key = delegated ? type : `${type}Native`
	const handlers = property(node, `${key}Handlers`, [])

	if (delegated) {
		if (!(type in Delegated) || Delegated[type] === 0) {
			Delegated[type] = 0
			document.addEventListener(type, eventHandlerDelegated, {
				passive: true,
			})
		}
		Delegated[type]++
		// remove event on cleanup if not in use
		cleanup(() => {
			if (--Delegated[type] === 0) {
				document.removeEventListener(type, eventHandlerDelegated)
			}
		})
	} else {
		if (handlers.length === 0) {
			node.addEventListener(type, eventHandlerNative)
		}
	}

	// remove event on cleanup
	cleanup(() => {
		removeEventListener(node, type, handler, delegated, false)
	})

	// handler may be already in use
	if (handler[$meta] === undefined)
		handler[$meta] = isArray(handler) ? handler : [handler]

	handlers.unshift(handler)

	if (external)
		return () => removeEventListener(node, type, handler, delegated)
}

/**
 * Removes an event listener from a node
 *
 * @param {Elements} node - Element to add the event listener
 * @param {string} type - The name of the event listener
 * @param {Handler} handler - Function to handle the event
 * @param {boolean} [delegated] - To choose delegation or not
 * @param {boolean} [external] - External defaults to true and avoids
 *   returning an `off` function for the event listener
 * @returns {Function | void} - An `on` function for adding back the
 *   event listener
 */
export function removeEventListener(
	node,
	type,
	handler,
	delegated = true,
	external = true,
) {
	const key = delegated ? type : `${type}Native`

	const handlers = property(node, `${key}Handlers`)

	removeFromArray(handlers, handler)
	if (!delegated && handlers.length === 0) {
		node.removeEventListener(type, eventHandlerNative)
	}
	if (external)
		return () => addEventListener(node, type, handler, delegated)
}

/** @param {Event} e - Event */
function eventHandlerNative(e) {
	const key = `${e.type}Native`
	const node = e.currentTarget
	const handlers = property(node, `${key}Handlers`)
	eventDispatch(e.target, handlers, e)
}

/** @param {Event} e - Event */
function eventHandlerDelegated(e) {
	const key = e.type

	let node = e.target

	// currentTarget has to be the element that has the handlers
	defineProperty(e, 'currentTarget', {
		/**
		 * It's a getter because the `while(node)` keeps changing the
		 * `node` aka currentTarget as we walk up the tree
		 */
		get() {
			return node
		},
	})

	for (node of e.composedPath()) {
		const handlers = property(node, `${key}Handlers`)
		if (handlers && !node.disabled) {
			eventDispatch(node, handlers, e)
			if (e.cancelBubble) break
		}
	}
}
/**
 * @param {Elements} node
 * @param {Function[]} handlers
 * @param {Event} e - Event
 */
function eventDispatch(node, handlers, e) {
	for (const handler of handlers) {
		try {
			handler[$meta][0].call(node, ...handler[$meta].slice(1), e)
		} catch (e) {
			console.error(e)
		}
		if (e.cancelBubble) break
	}
}
