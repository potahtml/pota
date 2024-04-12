import { removeFromArray } from '../std/removeFromArray.js'
import { effect } from './reactive.js'

/**
 * Creates an asynchronously effect
 *
 * @param {(currentRunningEffect: Promise<any>) => any} fn - A
 *   function that receives a `currentRunningEffect` that should be
 *   awaited for when wanting to run effects synchronously, that's it
 *   one effect after another.
 */
export function asyncEffect(fn) {
	const queue = []
	effect(() => {
		const { promise, resolve } = Promise.withResolvers()

		queue.push(promise)

		function onDone() {
			removeFromArray(queue, promise)
			resolve()
		}

		fn(queue.length === 1 ? undefined : queue[queue.length - 2])
			.then(onDone)
			.catch(onDone)
	})
}
