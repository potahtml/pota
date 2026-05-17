import { addEvent } from '../lib/reactive.js'
import { document } from './dom.js'

/**
 * Returns a ref function that fires `handler` when a `pointerdown`
 * occurs outside the element.
 *
 * @param {(e: PointerEvent, node: Element) => void} handler
 * @param {{ once?: boolean }} [options]
 * @url https://pota.quack.uy/use/clickoutside
 */
export const clickOutside = (handler, options) => node =>
	addEvent(document, 'pointerdown', {
		handleEvent(e) {
			if (!node.contains(/** @type {Element} */ (e.target))) {
				handler(e, node)
			}
		},
		once: options?.once,
	})
