import { markReactive } from '../@main.js'

// abstracts maverick reactivity

import {
	root as _root,
	signal as _signal,
	computed as _memo,
	effect as _effect,
	onDispose as _cleanup,
	setContext,
	getContext,
	tick,
	peek as _untrack,
	getScope as getOwner,
	scoped as runWithOwner,
} from '@maverick-js/signals'

/**
 * Creates a signal
 *
 * @param {unknown} [initialValue] - Initial value of the signal
 * @param {unknown} [options] - Signal options
 * @returns {[
 * 	Signal,
 * 	Function | ((currentValue: unknown) => unknown),
 * ]}
 *   - Read/write tuple
 */
export const signal = (initialValue, options) => {
	const s = _signal(initialValue, options)
	return [markReactive(() => s()), v => s.set(v)]
}

/**
 * Creates a read-only signal from the return value of a function that
 * automatically updates
 *
 * @param {Function} fn - Function to re-run when dependencies change
 * @returns {Signal} - Read only signal
 */
const memo = fn => markReactive(_memo(fn))

/**
 * Creates a new root
 *
 * @param {(dispose: Function) => any} fn
 * @returns {unknown}
 */
export const root = fn => _root(dispose => fn(dispose))

/**
 * Creates a renderEffect
 *
 * @param {Function} fn
 */
export const renderEffect = fn => {
	_effect(fn)
	tick()
	return void 0
}

/**
 * Creates an effect
 *
 * @param {Function} fn
 */
export const effect = fn => {
	_effect(fn)
	return void 0
}

/**
 * Batches changes to signals
 *
 * @param {Function} fn
 * @returns {unknown}
 */
export const batch = fn => fn()

/**
 * Runs a callback on cleanup, returns callback
 *
 * @template T
 * @param {Generic<T>} fn
 * @returns {Generic<T>}
 */
export const cleanup = fn => {
	_cleanup(fn)
	return fn
}

/**
 * Disables tracking for a function
 *
 * @param {Function} fn - Function to run with tracking disabled
 * @returns {any}
 */
export const untrack = fn => _untrack(fn)

/**
 * Creates a context and returns a function to get or set the value
 *
 * @param {unknown} [defaultValue] - Default value for the context
 * @returns {typeof Context} Context
 */
export function Context(defaultValue = undefined) {
	const id = Symbol()

	/**
	 * @overload Gets the context value
	 * @returns {any} Context value
	 */
	/**
	 * @overload Runs `fn` with a new value as context
	 * @param {unknown} newValue - New value for the context
	 * @param {Function} fn - Callback to run with the new context value
	 * @returns {Children} Children
	 */
	/**
	 * @param {unknown | undefined} newValue
	 * @param {Function | undefined} fn
	 */
	function Context(newValue, fn) {
		if (newValue === undefined) {
			return getContext(id) ?? defaultValue
		} else {
			let res
			renderEffect(() => {
				setContext(id, newValue)
				_untrack(() => {
					res = fn()
				})
			})

			return res
		}
	}

	return Context
}

/**
 * Lazy version of `memo`, it will run the function only when used
 *
 * @author Fabio Spampinato
 * @param {Function} fn - Function to re-run when dependencies change
 * @returns {Signal}
 */
function lazyMemo(fn) {
	const [sleeping, setSleeping] = signal(true)
	const m = memo(() => {
		if (sleeping()) return
		return fn()
	})

	let read = markReactive(() => {
		setSleeping(false)
		read = m
		return m()
	})
	return read
}
export { lazyMemo as memo }

/**
 * Returns a function on which you can pass functions to run with the
 * current owner
 *
 * - @returns {(fn)=>any}
 */
export const withOwner = () => {
	const owner = getOwner()
	return fn => runWithOwner(fn, owner)
}

/**
 * Returns current owner
 *
 * @returns {unknown}
 */
export const owner = getOwner
