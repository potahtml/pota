import { toArray, window } from '../lib/std.js'
import { activeElement, document, querySelectorAll } from './dom.js'

import { Emitter } from './emitter.js'
import {
	addEventNative,
	passiveEvent,
	removeEventNative,
} from './event.js'

const elements = () =>
	toArray(
		querySelectorAll(
			document,
			'input:not([type=hidden]), button, select, textarea, a, [tabindex]',
		),
	)

/**
 * Focuses the next tabbable element in the document, wrapping to the
 * start.
 */
export function focusNext() {
	const all = elements()

	const element = all[all.indexOf(activeElement()) + 1] || all[0]
	element && /** @type DOMElement */ (element).focus()
}

/**
 * Focuses the previous tabbable element in the document, wrapping to
 * the end.
 */
export function focusPrevious() {
	const all = elements()

	const element =
		all[all.indexOf(activeElement()) - 1] || all[all.length - 1]
	element && /** @type DOMElement */ (element).focus()
}

const initialValue = () => !document.hidden

export const { on: onDocumentFocus, use: useDocumentFocus } =
	new Emitter({
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
