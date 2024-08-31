import {
	addEventListenerObject,
	documentElement,
	passiveEvent,
	removeEventListenerObject,
	window,
} from '../lib/std.js'

import { SignalEmitter } from '../lib/classes/SignalEmitter.js'

export const documentSize = () => ({
	width: documentElement.clientWidth,
	height: documentElement.clientHeight,
})

export const { on: onDocumentSize, use: useDocumentSize } =
	new SignalEmitter({
		on: dispatch => {
			const handler = passiveEvent(() => dispatch(documentSize()))

			addEventListenerObject(window, 'resize', handler)

			return () => {
				removeEventListenerObject(window, 'resize', handler)
			}
		},
		initialValue: documentSize,
	})
