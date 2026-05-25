import { isFunction } from '../lib/std.js'

import { copyToClipboard } from '../use/string.js'

import { addEvent } from '../lib/reactive.js'

/**
 * Returns a ref function that copies text to the clipboard on click.
 *
 * - When `value` is a string or number, that value is copied.
 * - When `value` is a function, it is called with the click event and
 *   its return value is copied.
 * - When `value` is `true`, the element's trimmed `innerText` is
 *   copied.
 *
 * @param {((e: PointerEvent) => string | number)
 * 	| boolean
 * 	| string
 * 	| number} value
 * @url https://pota.quack.uy/use/clipboard
 */
export const clipboard = value => node =>
	addEvent(node, 'click', e => {
		copyToClipboard(
			/** @type {string} */ (
				isFunction(value)
					? value(e)
					: value !== true
						? value
						: /** @type {HTMLElement} */ (node).innerText.trim()
			),
		)
	})
