import { addEvent } from '../lib/reactive.js'
import { Emitter } from './emitter.js'

import {
	addEventNative,
	passiveEvent,
	removeEventNative,
} from './event.js'
import { document, documentElement, getValueElement } from './dom.js'

/**
 * Returns a ref function that toggles fullscreen on click. If
 * `target` is omitted, the element itself is fullscreened; pass an
 * element, or a function returning an element, to fullscreen
 * something else (e.g. a sibling or ancestor).
 *
 * @param {DOMElement
 * 	| ((e: PointerEvent, node: DOMElement) => DOMElement)} [target]
 * @url https://pota.quack.uy/use/fullscreen
 */
export const fullscreen = target => node =>
	addEvent(node, 'click', e => {
		toggleFullscreen(
			/** @type {DOMElement} */ (
				getValueElement(target ?? node, e, node)
			),
		)
	})

// this fails on startup for some reason
/**
 * Reads the current fullscreen element, if any.
 *
 * @returns {Element | null}
 */
export const isFullscreen = () => document.fullscreenElement

export const { on: onFullscreen, use: useFullscreen } = new Emitter({
	on: dispatch => {
		const handler = passiveEvent(() => dispatch(isFullscreen()))

		addEventNative(document, 'fullscreenchange', handler)

		return () => {
			removeEventNative(document, 'fullscreenchange', handler)
		}
	},
	initialValue: isFullscreen,
})

/**
 * Requests the browser to exit fullscreen mode.
 *
 * @returns {Promise<void>}
 */
export const exitFullscreen = () => document.exitFullscreen()

/** @param {DOMElement} element */
export const requestFullscreen = element =>
	element.requestFullscreen()

/** @param {DOMElement} [element] */
export function toggleFullscreen(element) {
	isFullscreen()
		? exitFullscreen()
		: requestFullscreen(element || documentElement)

	return isFullscreen()
}
