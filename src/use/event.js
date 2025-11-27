import {
	empty,
	isFunction,
	promise,
	weakStore,
	withState,
} from '../lib/std.js'

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

/**
 * Adds an event listener using the handler object itself as options.
 *
 * @param {EventTarget} where
 * @param {string} type
 * @param {EventListenerOrEventListenerObject} handler
 * @returns {void}
 */
export const addEventNative = (where, type, handler) =>
	where.addEventListener(
		type,
		/** @type {EventListenerOrEventListenerObject} */ (
			/** @type unknown */ handler
		),
		!isFunction(handler)
			? /** @type {EventHandlerOptions} */ (handler)
			: undefined,
	)

/**
 * Removes an event listener previously registered via
 * `addEventNative`.
 *
 * @param {EventTarget} where
 * @param {string} type
 * @param {EventListenerOrEventListenerObject} handler
 * @returns {void}
 */
export const removeEventNative = (where, type, handler) =>
	where.removeEventListener(
		type,
		/** @type {EventListenerOrEventListenerObject} */ (
			/** @type unknown */ handler
		),
		!isFunction(handler)
			? /** @type {EventHandlerOptions} */ (handler)
			: undefined,
	)

/** @param {EventListener} fn */
export const passiveEvent = fn => ({ handleEvent: fn, passive: true })
