import { addEvent } from '../lib/reactive.js'
import { Emitter } from './emitter.js'

import { propsPlugin } from '../core/props/plugin.js'
import {
	addEventNative,
	passiveEvent,
	removeEventNative,
} from './event.js'
import { document, documentElement, getValueElement } from './dom.js'

/**
 * @param {JSX.DOMElement} node
 * @param {Function} value
 * @url https://pota.quack.uy/use/fullscreen
 */
const fullscreen = (node, value) =>
	addEvent(node, 'click', e => {
		toggleFullscreen(
			/** @type {JSX.DOMElement} */ (getValueElement(value, e, node)),
		)
	})

propsPlugin('use:fullscreen', fullscreen)

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

/** @param {JSX.DOMElement} element */
export const requestFullscreen = element =>
	element.requestFullscreen()

/** @param {JSX.DOMElement} element */
export function toggleFullscreen(element) {
	isFullscreen()
		? exitFullscreen()
		: requestFullscreen(element || documentElement)

	return isFullscreen()
}
