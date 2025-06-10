import {
	getValueElement,
	addEventNative,
	document,
	documentElement,
	passiveEvent,
	removeEventNative,
} from '../lib/std.js'

import { addEvent } from '../lib/reactive.js'
import { SignalEmitter } from '../lib/classes/SignalEmitter.js'

import { propsPlugin } from '../core/props/plugin.js'

/**
 * @param {Element} node
 * @param {string} propName
 * @param {Function} propValue
 * @param {object} props
 * @url https://pota.quack.uy/use/fullscreen
 */
const fullscreen = (node, propName, propValue, props) =>
	addEvent(node, 'click', e => {
		toggleFullscreen(
			/** @type {Element} */ (getValueElement(propValue, e, node)),
		)
	})

propsPlugin('plugin:fullscreen', fullscreen)

// this fails on startup for some reason
export const isFullscreen = () => document.fullscreenElement

export const { on: onFullscreen, use: useFullscreen } =
	new SignalEmitter({
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

/** @param {Element} element */
export const requestFullscreen = element =>
	element.requestFullscreen()

/** @param {Element} element */
export function toggleFullscreen(element) {
	isFullscreen()
		? exitFullscreen()
		: requestFullscreen(element || documentElement)

	return isFullscreen()
}
