import { makeCallback, map } from '../lib/reactive.js'
import {
	activeElement,
	documentElement,
	isConnected,
} from '../lib/std.js'

import { onFixes } from '../scheduler.js'

/**
 * Renders reactive values from an signal that returns an Iterable
 * object
 *
 * @template T
 * @param {object} props
 * @param {Each<T>} props.each
 * @param {boolean} [props.restoreFocus] - If the focused element
 *   moves it may lose focus
 * @param {Children} [props.children]
 * @param {Children} [props.fallback]
 * @returns {Children}
 * @url https://pota.quack.uy/Components/For
 */

export const For = props =>
	map(
		() => {
			props.restoreFocus && queue()
			return props.each
		},
		makeCallback(props.children),
		true,
		props.fallback,
	)

let queued

// because re-ordering the elements trashes focus
function queue() {
	if (!queued) {
		queued = true

		const active = activeElement()
		const scroll = documentElement.scrollTop

		onFixes(() => {
			queued = false
			// re-ordering the elements trashes focus
			active &&
				active !== activeElement() &&
				isConnected(active) &&
				active.focus()

			documentElement.scrollTop = scroll
		})
	}
}
