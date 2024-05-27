import { isFunction } from '../std/isFunction.js'
import { isObject } from '../std/isObject.js'
import { microtask } from '../std/microtask.js'
import { nothing } from '../std/nothing.js'

import { markComponent } from '../component/markComponent.js'

import { owned, signal } from './reactive.js'

/**
 * A Promise loader handler. Allows to display/run something or
 * nothing while a promise is resolving. Allows to run a callback when
 * the promise resolves. Allows to get notified of errors, and
 * display/run something or nothing, if wanted a `retry` function is
 * given for retrying the promise. All functions run with the original
 * owner, so it's `Context` friendly.
 *
 * @param {() => Promise<any>} fn - Function that returns a promise
 * @param {{
 * 	onLoading?: any
 * 	onLoaded?: Function
 * 	onError?: ((e: Error, retry: Function) => any) | any
 * }} [options]
 *
 * @returns {Component}
 * @url https://pota.quack.uy/lazy
 */
export const lazy = (fn, options = nothing) =>
	markComponent(props => {
		const { onLoading, onLoaded, onError } = options

		const [value, setValue] = signal(onLoading)

		const _onLoaded = owned(onLoaded)

		const retry = () =>
			fn()
				.then(r => {
					setValue(
						markComponent(() => {
							r = isObject(r) && r.default ? r.default : r
							return isFunction(r) ? r(props) : r
						}),
					)
					microtask(_onLoaded)
				})
				.catch(e =>
					onError
						? setValue(
								markComponent(() =>
									isFunction(onError) ? onError(e, retry) : onError,
								),
							)
						: console.error(e),
				)
		retry()

		return value
	})

export const Lazy = props => lazy(props.children, props)
