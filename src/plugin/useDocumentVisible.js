import {
	addEventNative,
	document,
	passiveEvent,
	removeEventNative,
} from '../lib/std.js'

import { SignalEmitter } from '../lib/classes/SignalEmitter.js'

export const isDocumentVisible = () =>
	document.visibilityState === 'visible'

export const { on: onDocumentVisible, use: useDocumentVisible } =
	new SignalEmitter({
		on: dispatch => {
			const handler = passiveEvent(() =>
				dispatch(isDocumentVisible()),
			)

			addEventNative(document, 'visibilitychange', handler)

			return () => {
				removeEventNative(document, 'visibilitychange', handler)
			}
		},
		initialValue: isDocumentVisible,
	})
