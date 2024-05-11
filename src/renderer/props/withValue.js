import { getValue } from '../../lib/std/getValue.js'
import { isFunction } from '../../lib/std/isFunction.js'
import { effect } from '../../lib/reactivity/reactive.js'

import {
	isDevelopment,
	useDevTools,
} from '../../devTools/development.js'

/**
 * Runs a function inside an effect if value is a function
 *
 * @param {PropertyKey} name
 * @param {any} value
 * @param {(value) => any} fn
 */
export function withValue(name, value, fn) {
	if (isDevelopment()) {
		if (isFunction(value)) {
			useDevTools(
				{
					__dev: {
						__pota: { kind: 'attribute', name, value },
					},
				},
				() => {
					effect(() => {
						fn(getValue(value))
					})
				},
			)
		} else {
			fn(value)
		}
	} else {
		isFunction(value)
			? effect(() => {
					fn(getValue(value))
				})
			: fn(value)
	}
}
