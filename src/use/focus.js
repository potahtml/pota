import { toArray, window } from '../lib/std.js'
import { activeElement, document, querySelectorAll } from './dom.js'

import { Emitter } from './emitter.js'
import {
	addEventNative,
	passiveEvent,
	removeEventNative,
} from './event.js'
import { isDisabled } from './form.js'

/** @returns {HTMLElement[]} */
const elements = () =>
	/** @type {HTMLElement[]} */ (
		toArray(
			querySelectorAll(
				document,
				'input:not([type=hidden]), button, select, textarea, a, [tabindex], [contenteditable]',
			),
		)
	)

/**
 * Focuses the next tabbable element in the document, wrapping to the
 * start.
 */
export function focusNext(all = elements()) {
	const idx = all.indexOf(
		/** @type {HTMLElement} */ (activeElement()),
	)

	// Try to find the next non-disabled element after current
	all.some((el, i) => {
		if (i > idx && !isDisabled(el)) {
			el.focus()
			return true // stop looping
		}
	}) ||
		// If nothing found after current, wrap around from the start
		all.some(el => {
			if (!isDisabled(el)) {
				el.focus()
				return true
			}
		})
}

/**
 * Focuses the previous tabbable element in the document, wrapping to
 * the end.
 */
export function focusPrevious(all = elements()) {
	focusNext(all.reverse())
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
