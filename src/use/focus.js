import { addEvent } from '../lib/reactive.js'
import { onMount } from '../core/scheduler.js'
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

/**
 * Ref function: focuses the element once it is mounted in the DOM.
 *
 * @param {HTMLElement} node
 * @url https://pota.quack.uy/use/focus
 */
export const autoFocus = node => {
	onMount(() => node.focus())
}

/**
 * Ref function: selects the input/textarea contents whenever the
 * element receives focus.
 *
 * @param {HTMLInputElement | HTMLTextAreaElement} node
 * @url https://pota.quack.uy/use/focus
 */
export const selectOnFocus = node => {
	addEvent(node, 'focus', () => node.select?.())
}

/**
 * Ref function: confines Tab/Shift+Tab navigation to focusable
 * descendants of the element. Useful for modal-like UI. Does nothing
 * when the element has no focusable descendants.
 *
 * @param {HTMLElement} node
 * @url https://pota.quack.uy/use/focus
 */
export const trapFocus = node => {
	addEvent(node, 'keydown', e => {
		if (e.key !== 'Tab') return
		const focusable = /** @type {HTMLElement[]} */ (
			toArray(
				querySelectorAll(
					node,
					'input:not([type=hidden]), button, select, textarea, a[href], [tabindex]:not([tabindex="-1"]), [contenteditable]',
				),
			).filter(el => !isDisabled(el))
		)
		if (focusable.length === 0) return
		const first = focusable[0]
		const last = focusable[focusable.length - 1]
		const current = /** @type {HTMLElement} */ (activeElement())
		if (e.shiftKey && current === first) {
			e.preventDefault()
			last.focus()
		} else if (!e.shiftKey && current === last) {
			e.preventDefault()
			first.focus()
		}
	})
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
