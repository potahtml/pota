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
 * @param {DOMElement} node
 * @param {Function} value
 * @url https://pota.quack.uy/use/fullscreen
 */
const fullscreen = (node, value) =>
	addEvent(node, 'click', e => {
		toggleFullscreen(
			/** @type {DOMElement} */ (getValueElement(value, e, node)),
		)
	})

propsPlugin('use:fullscreen', fullscreen)

// this fails on startup for some reason
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

export const exitFullscreen = () => document.exitFullscreen()

/** @param {DOMElement} element */
export const requestFullscreen = element =>
	element.requestFullscreen()

/** @param {DOMElement} element */
export function toggleFullscreen(element) {
	isFullscreen()
		? exitFullscreen()
		: requestFullscreen(element || documentElement)

	return isFullscreen()
}
