import {
	addEventNative,
	documentElement,
	passiveEvent,
	removeEventNative,
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

			addEventNative(window, 'resize', handler)

			return () => {
				removeEventNative(window, 'resize', handler)
			}
		},
		initialValue: documentSize,
	})
