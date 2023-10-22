import { call } from '#std'

/**
 * The purpose of this file is to guarantee the timing of some
 * callbacks. It queues a microtask, then the callbacks are added to a
 * position in the array. These are run in priority.
 *
 * `onMount` should only run after a thing has been mounted
 *
 * `onReady` should only run after all pending things to be mounted,
 * has been mounted
 */

/** @type boolean */
let added

/** @type [][] */
let queue

/**
 * @type Function[]
 *
 *   | VoidFunction[]
 */
let finally_ = []

/** Resets the Scheduler */
function reset() {
	queue = [[], [], []]
	added = false
}

// initialization
reset()

/**
 * Queues a callback at a priority
 *
 * @param {number} priority - Priority
 * @param {pota.Handler} fn - Function to run once the callbacks at
 *   this priority run
 */
function add(priority, fn) {
	if (!added) {
		added = true
		queueMicrotask(run)
	}
	queue[priority].push(fn)
}

/** Runs all queued callbacks */
function run() {
	const q = queue
	reset()

	for (const fns of q) {
		for (const fn of fns) {
			call(fn)
		}
	}

	for (const fn of finally_) {
		call(fn)
	}
}

/**
 * Queue a function to run onMount (before onReady)
 *
 * @param {pota.Handler} fn
 */
export function onMount(fn) {
	add(0, fn)
}

/**
 * Queue a function to run onReady (after onMount)
 *
 * @param {pota.Handler} fn
 */
export function onReady(fn) {
	add(1, fn)
}

/**
 * Queue a function to run onRender (after onReady)
 *
 * @param {pota.Handler} fn
 */
export function onRender(fn) {
	add(2, fn)
}

/**
 * Queue a function to run after the queue is processed. Caution:
 * onFinally will only run if an onReady or onMount callback is found
 * in the code, else it wont run. This is intended to never be
 * cleaned.
 *
 * @param {VoidFunction | Function} fn
 */
export function onFinally(fn) {
	finally_.push(fn)
	// make sure we run it at least once
	queueMicrotask(fn)
}
