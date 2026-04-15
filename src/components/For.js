import {
	activeElement,
	documentElement,
	isConnected,
} from '../use/dom.js'

import { makeCallback, map } from '../lib/reactive.js'

import { onFixes } from '../core/scheduler.js'

/**
 * Renders reactive values from a signal that returns an Iterable
 * object
 *
 * @type {{
 * 	<T>(props: {
 * 		each: Each<T>
 * 		restoreFocus?: boolean
 * 		reactiveIndex?: false
 * 		children?: Children<(item: T, index: number) => JSX.Element>
 * 		fallback?: JSX.Element
 * 	}): JSX.Element
 * 	<T>(props: {
 * 		each: Each<T>
 * 		restoreFocus?: boolean
 * 		reactiveIndex: true
 * 		children?: Children<
 * 			(item: T, index: () => number) => JSX.Element
 * 		>
 * 		fallback?: JSX.Element
 * 	}): JSX.Element
 * }}
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
