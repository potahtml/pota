import {
	addEventListenerObject,
	document,
	passiveEvent,
	removeEventListenerObject,
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

			addEventListenerObject(window, 'focus', handler)
			addEventListenerObject(window, 'blur', handler)

			return () => {
				removeEventListenerObject(window, 'focus', handler)
				removeEventListenerObject(window, 'blur', handler)
			}
		},
		initialValue,
	})
