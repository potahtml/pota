import {
	addEventNative,
	document,
	passiveEvent,
	removeEventNative,
	window,
} from '../lib/std.js'

import { SignalEmitter } from '../lib/classes/SignalEmitter.js'

const initialValue = () => !document.hidden

export const { on: onDocumentFocus, use: useDocumentFocus } =
	new SignalEmitter({
		on: dispatch => {
			const handler = passiveEvent(e => {
				if (e.currentTarget === window) {
					dispatch(e.type === 'blur' ? false : true)
				}
			})

			addEventNative(window, 'focus', handler)
			addEventNative(window, 'blur', handler)

			return () => {
				removeEventNative(window, 'focus', handler)
				removeEventNative(window, 'blur', handler)
			}
		},
		initialValue,
	})
