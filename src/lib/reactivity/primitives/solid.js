import { markReactive } from '../@main.js'

// abstracts solid-js reactivity

import {
	// signals
	createSignal,
	createMemo,

	// effects
	createRoot,
	createRenderEffect,
	createEffect,
	batch as _batch,

	// cleanup/untrack
	onCleanup,
	untrack as _untrack,

	// context
	useContext,
	getOwner,
	runWithOwner,
} from 'solid-js/dist/solid.js' // /dist/dev.js

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
	const r = createSignal(initialValue, options)
	markReactive(r[0])
	return r
}

/**
 * Creates a read-only signal from the return value of a function that
 * automatically updates
 *
 * @param {Function} fn - Function to re-run when dependencies change
 * @param {{
 * 	equals?: false | ((prev: unknown, next: unknown) => boolean)
 * }} [options]
 *
 * @returns {Signal} - Read only signal
 */
const memo = (fn, options) => markReactive(createMemo(fn, options))

/**
 * Creates a new root
 *
 * @param {(dispose: Function) => any} fn
 * @returns {unknown}
 */
export const root = fn => createRoot(dispose => fn(dispose))

/**
 * Creates a renderEffect
 *
 * @param {Function} fn
 */
export const renderEffect = fn => {
	createRenderEffect(fn)
}

/**
 * Creates an effect
 *
 * @param {Function} fn
 */
export const effect = fn => {
	createEffect(fn)
}

/**
 * Batches changes to signals
 *
 * @param {Function} fn
 * @returns {unknown}
 */
export const batch = fn => _batch(fn)

/**
 * Runs a callback on cleanup, returns callback
 *
 * @template T
 * @param {Generic<T>} fn
 * @returns {Generic<T>}
 */
export const cleanup = fn => {
	onCleanup(fn)
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
export function Context(defaultValue = {}) {
	const id = Symbol()
	const context = { id, defaultValue }

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
			return useContext(context)
		} else {
			let res
			renderEffect(() => {
				untrack(() => {
					const owner = getOwner()
					owner.context = {
						...owner.context,
						[id]: newValue,
					}
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
 * @param {{
 * 	equals?: false | ((prev: unknown, next: unknown) => boolean)
 * }} [options]
 *
 * @returns {Signal}
 */
function lazyMemo(fn, options) {
	const [sleeping, setSleeping] = signal(true)
	const m = memo(() => {
		if (sleeping()) return
		return fn()
	}, options)

	let read = () => {
		setSleeping(false)
		read = m
		return m()
	}
	return markReactive(() => read())
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
	return fn => runWithOwner(owner, fn)
}
