import { empty } from '../std/empty.js'
import { weakStore } from '../std/weakStore.js'

const { get, set } = weakStore()

/**
 * Waits for an event to be dispatched and runs a callback
 *
 * @param {HTMLElement} element
 * @param {string} eventName
 */
export const waitEvent = (element, eventName) =>
	new Promise((resolve, reject) => {
		/**
		 * To prevent firing `transitionend` twice it needs to stop
		 * listening the old one because maybe wasn't dispatched and
		 * running a new transition will make it dispatch twice
		 */
		const previous = get(element, () => empty())
		previous.reject && previous.reject()
		element.removeEventListener(eventName, previous.resolve)
		set(element, { resolve, reject })
		element.addEventListener(eventName, resolve, {
			once: true,
		})
	})
