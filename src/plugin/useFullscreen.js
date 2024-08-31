import {
	addEventListenerObject,
	document,
	documentElement,
	passiveEvent,
	removeEventListenerObject,
} from '../lib/std.js'

import { SignalEmitter } from '../lib/classes/SignalEmitter.js'

// this fails on startup for some reason
export const isFullscreen = () => document.fullscreenElement

export const { on: onFullscreen, use: useFullscreen } =
	new SignalEmitter({
		on: dispatch => {
			const handler = passiveEvent(() => dispatch(isFullscreen()))

			addEventListenerObject(document, 'fullscreenchange', handler)

			return () => {
				removeEventListenerObject(
					document,
					'fullscreenchange',
					handler,
				)
			}
		},
		initialValue: isFullscreen,
	})

export const exitFullscreen = () => document.exitFullscreen()

export const requestFullscreen = element =>
	element.requestFullscreen()

export function toggleFullscreen(element) {
	isFullscreen()
		? exitFullscreen()
		: requestFullscreen(element || documentElement)

	return isFullscreen()
}
