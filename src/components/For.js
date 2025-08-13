import {
	activeElement,
	documentElement,
	isConnected,
} from '../use/dom.js'

import { makeCallback, map } from '../lib/reactive.js'

import { onFixes } from '../core/scheduler.js'

/**
 * Renders reactive values from an signal that returns an Iterable
 * object
 *
 * @template T
 * @param {object} props
 * @param {Each<T>} props.each
 * @param {boolean} [props.restoreFocus] - If the focused element
 *   moves it may lose focus
 * @param {boolean} [props.reactiveIndex] - Make indices reactive
 *   signals
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
		false,
		props.fallback,
		props.reactiveIndex,
	)

/** @type {boolean} */
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
				// @ts-expect-error
				active.focus()

			documentElement.scrollTop = scroll
		})
	}
}
