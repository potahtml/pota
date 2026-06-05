import { weakStore } from '../lib/std.js'
import { Emitter } from './emitter.js'

const emitters = weakStore()

/**
 * @param {Node} node
 * @param {MutationObserverInit} [init]
 * @returns {Emitter<MutationRecord[]>}
 */
const getEmitter = (node, init) =>
	emitters.get(
		node,
		() =>
			new Emitter({
				on: dispatch => {
					const mo = new MutationObserver(records =>
						dispatch(records),
					)
					mo.observe(node, init ?? { childList: true, subtree: true })
					return () => mo.disconnect()
				},
			}),
	)

/**
 * Returns a signal accessor that reflects the latest batch of
 * `MutationRecord`s for `node`. Multiple subscribers on the same node
 * share one observer; `init` from later calls is ignored.
 *
 * @param {Node} node
 * @param {MutationObserverInit} [init]
 * @url https://pota.quack.uy/use/mutation/useMutations
 */
export const useMutations = (node, init) =>
	getEmitter(node, init).use()

/**
 * Registers a callback fired on each batch of mutations for `node`.
 * The callback is **not** invoked with the pre-observer placeholder —
 * only with real `MutationRecord[]` batches.
 *
 * @param {Node} node
 * @param {(records: MutationRecord[]) => void} fn
 * @param {MutationObserverInit} [init]
 * @url https://pota.quack.uy/use/mutation/onMutations
 */
export const onMutations = (node, fn, init) =>
	getEmitter(node, init).on(records => {
		if (records !== undefined) fn(records)
	})

/**
 * Ref factory: invokes `handler` with each batch of `MutationRecord`s
 * observed on the element. Default `init` is `{ childList: true,
 * subtree: true }`.
 *
 * @param {(records: MutationRecord[]) => void} handler
 * @param {MutationObserverInit} [init]
 * @url https://pota.quack.uy/use/mutation/mutated
 */
export const mutated = (handler, init) => node =>
	onMutations(node, handler, init)
