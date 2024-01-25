import { call, microtask } from '../lib/std/@main.js'

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
const finally_ = []

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
 * @param {Handler} fn - Function to run once the callbacks at this
 *   priority run
 */
function add(priority, fn) {
	enqueue()
	queue[priority].push(fn)
}

function enqueue() {
	if (!added) {
		added = true
		microtask(run)
	}
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
 * @param {Handler} fn
 */
export const onMount = fn => add(0, fn)

/**
 * Queue a function to run onReady (after onMount)
 *
 * @param {Handler} fn
 * @url https://pota.quack.uy/onReady
 */
export const onReady = fn => add(1, fn)

/**
 * Queue a function to run after all user defined processes
 *
 * @param {Handler} fn
 */
export const onDone = fn => add(2, fn)

/**
 * Finally_ is intended to never be cleaned.
 *
 * @param {VoidFunction | Function} fn
 */
export function onFinally(fn) {
	enqueue()
	finally_.push(fn)
}
