import { Symbol } from '../../std/Symbol.js'

import { markReactive } from '../@main.js'

// abstracts oby reactivity

import $, {
	// signals
	memo as _memo,

	// effects
	root as _root,
	effect as _effect,
	batch as _batch,

	// cleanup/untrack
	cleanup as _cleanup,
	untrack as _untrack,

	// context
	context as _context,
	with as with_,
	owner as _owner,
} from 'oby'

/**
 * Creates a signal
 *
 * @param {any} [initialValue] - Initial value of the signal
 * @param {SignalOptions} [options] - Signal options
 * @returns {[Signal, SignalSetter]}
 *
 *   - Read/write tuple
 */
export const signal = (initialValue, options) => {
	const s = $(initialValue, options)
	return [markReactive(() => s()), s]
}

/**
 * Creates a read-only signal from the return value of a function that
 * automatically updates
 *
 * @param {Function} fn - Function to re-run when dependencies change
 * @param {SignalOptions} [options]
 * @returns {Signal} - Read only signal
 */
const memo = (fn, options) => markReactive(_memo(fn, options))

/**
 * Creates a new root
 *
 * @param {(dispose: Function) => any} fn
 * @returns {any}
 */
export const root = fn => _root(dispose => fn(dispose))

/**
 * Creates a renderEffect
 *
 * @param {Function} fn
 */
export const renderEffect = fn => {
	_effect(fn, { sync: 'init' })
}

/**
 * Creates an effect
 *
 * @param {Function} fn
 */
export const effect = fn => {
	_effect(fn)
}

/**
 * Batches changes to signals
 *
 * @param {Function} fn
 * @returns {any}
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
 * @param {any} [defaultValue] - Default value for the context
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
	 * @param {any} newValue - New value for the context
	 * @param {Function} fn - Callback to run with the new context value
	 * @returns {Children} Children
	 */
	/**
	 * @param {any} newValue
	 * @param {Function | undefined} fn
	 */
	function Context(newValue, fn) {
		if (newValue === undefined) {
			return _context(id) ?? defaultValue
		} else {
			let r
			_context({ [id]: newValue }, () => {
				r = untrack(fn)
			})
			return r
		}
	}

	return Context
}

/**
 * Lazy version of `memo`, it will run the function only when used
 *
 * @author Fabio Spampinato
 * @param {Function} fn - Function to re-run when dependencies change
 * @param {SignalOptions} [options]
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
 * @returns {(fn) => any}
 */
export const withOwner = () => {
	const owned = with_()
	return fn => owned(fn)
}

/**
 * Returns current owner
 *
 * @returns {unknown}
 */
export const owner = _owner
