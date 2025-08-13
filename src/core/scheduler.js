import { owned } from '../lib/reactive.js'
import { call, queueMicrotask } from '../lib/std.js'

/**
 * The purpose of this file is to guarantee the timing of some
 * callbacks. It queues a microtask, then the callbacks are added to a
 * position in the array. These are run with a priority.
 */

/** @type boolean */
let added

/** @type (()=>void)[][] */
let queue

function reset() {
	queue = [[], [], [], [], []]
	added = false
}

// initialization
reset()

/**
 * Queues a callback at a priority
 *
 * @param {PropertyKey} priority - Priority
 * @param {() => void} fn - Function to run once the callbacks at this
 *   priority run
 */
function add(priority, fn) {
	if (!added) {
		added = true
		queueMicrotask(run)
	}
	queue[priority].push(owned(fn))
}

/** Runs all queued callbacks */
function run() {
	const q = queue
	reset()

	for (const fns of q) {
		fns.length && call(fns)
	}
}

/**
 * Queue a function to run before everything else (onProps, onRef,
 * onMount, ready) ex focus restoration
 *
 * @param {() => void} fn
 */
export const onFixes = fn => add(0, fn)

/**
 * Queue a function to run before (onRef, onMount, ready) ex running
 * user functions on elements via plugins
 *
 * @param {() => void} fn
 */
export const onProps = fn => add(1, fn)

/**
 * Queue a function to run onMount (before ready, after onRef)
 *
 * @param {() => void} fn
 */
export const onMount = fn => add(2, fn)

/**
 * Queue a function to run on ready (after onMount)
 *
 * @param {() => void} fn
 * @url https://pota.quack.uy/ready
 */
export const ready = fn => add(3, fn)

/**
 * Queue a function to run after all user defined processes
 *
 * @param {() => void} fn
 */
export const onDone = fn => add(4, fn)
