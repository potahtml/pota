import {
	addEventListenerObject,
	document,
	passiveEvent,
	removeEventListenerObject,
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

			addEventListenerObject(document, 'visibilitychange', handler)

			return () => {
				removeEventListenerObject(
					document,
					'visibilitychange',
					handler,
				)
			}
		},
		initialValue: isDocumentVisible,
	})
