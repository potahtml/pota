import { empty, promise, weakStore, withState } from '../lib/std.js'

/**
 * @template {Event} T
 * @param {T} e
 */
export const preventDefault = e => e.preventDefault()

/**
 * @template {Event} T
 * @param {T} e
 */
export const stopPropagation = e => e.stopPropagation()

/**
 * @template {Event} T
 * @param {T} e
 */
export const stopImmediatePropagation = e =>
	e.stopImmediatePropagation()

/**
 * @template {Event} T
 * @param {T} e
 */
export function stopEvent(e) {
	preventDefault(e)
	stopPropagation(e)
	stopImmediatePropagation(e)
}

/**
 * @param {Element | typeof globalThis} node
 * @param {string} eventName
 * @param {CustomEventInit} [data]
 */

export const emit = (
	node,
	eventName,
	data = { bubbles: true, cancelable: true, composed: true },
) => node.dispatchEvent(new CustomEvent(eventName, data))

/**
 * Waits for an event to be dispatched and runs a callback
 *
 * @param {Element} element
 * @param {string} eventName
 */
export const waitEvent = withState(
	(state, element, eventName) =>
		promise((resolve, reject) => {
			/**
			 * To prevent firing `transitionend` twice it needs to stop
			 * listening the old one because maybe wasn't dispatched and
			 * running a new transition will make it dispatch twice
			 */
			const previous = state.get(element, empty)
			previous.reject && previous.reject()
			element.removeEventListener(eventName, previous.resolve)
			state.set(element, { resolve, reject })
			element.addEventListener(eventName, resolve, {
				once: true,
			})
		}),
	weakStore,
)

export const addEventNative = (where, type, handler) =>
	where.addEventListener(type, handler, handler)

export const removeEventNative = (where, type, handler) =>
	where.removeEventListener(type, handler, handler)

/** @param {EventListener} fn */
export const passiveEvent = fn => ({ handleEvent: fn, passive: true })
