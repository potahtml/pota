import { lazy } from '../../lib/reactive.js'
import { isFunction, nothing } from '../../lib/std.js'

import { useTimeout } from '../../plugin/useTimeout.js'

import { Context } from './context.js'
import { scroll } from './scroll.js'

/**
 * For dynamic imports. For `lazy` components see `lazy` instead. Used
 * as `load(()=>import('file.js'))`. It retries a couple of times on
 * network error. Scrolls the document to the hash of the url, or
 * fallbacks defined on the `<Route>` components.
 *
 * @param {() => Promise<any>} component - Import statement
 * @param {{
 * 	onLoading?: any
 * 	onLoaded?: Function
 * 	onError?: ((e: Error, retry: Function) => any) | any
 * }} [options]
 * @returns {Component}
 * @url https://pota.quack.uy/load
 */
export function load(component, options = nothing) {
	const { onLoading, onLoaded, onError } = options

	let tries = 0
	return lazy(component, {
		onLoading,
		onError: (e, retry) =>
			tries++ < 10
				? useTimeout(retry, 5000).start() && undefined
				: isFunction(onError)
					? onError(e, retry)
					: onError,
		onLoaded: () => {
			let context = Context()

			scroll(context)

			// user function
			onLoaded && onLoaded()
		},
	})
}
