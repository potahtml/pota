import { cleanup } from '../lib/reactive.js'
import { weakStore } from '../lib/std.js'
import { Emitter } from './emitter.js'

const emitters = weakStore()

/**
 * @param {Element} node
 * @param {IntersectionObserverInit} [opts]
 * @returns {Emitter<IntersectionObserverEntry>}
 */
const getEmitter = (node, opts) =>
	emitters.get(
		node,
		() =>
			new Emitter({
				on: dispatch => {
					const io = new IntersectionObserver(
						entries => dispatch(entries[0]),
						opts,
					)
					io.observe(node)
					return () => io.disconnect()
				},
			}),
	)

/**
 * Returns a signal accessor that reflects the latest
 * `IntersectionObserverEntry` for `node`. Multiple subscribers on the
 * same node share one observer; `opts` from later calls are ignored.
 *
 * @param {Element} node
 * @param {IntersectionObserverInit} [opts]
 * @url https://pota.quack.uy/use/intersection
 */
export const useVisible = (node, opts) => getEmitter(node, opts).use()

/**
 * Registers a callback fired on each intersection change for `node`.
 * The callback is **not** invoked with the pre-observer placeholder —
 * only with real `IntersectionObserverEntry`s.
 *
 * @param {Element} node
 * @param {(entry: IntersectionObserverEntry) => void} fn
 * @param {IntersectionObserverInit} [opts]
 * @url https://pota.quack.uy/use/intersection
 */
export const onVisible = (node, fn, opts) =>
	getEmitter(node, opts).on(entry => {
		if (entry !== undefined) fn(entry)
	})

/**
 * Ref factory: invokes `handler` with the latest
 * `IntersectionObserverEntry` whenever the element's intersection
 * with the viewport (or `opts.root`) changes.
 *
 * @param {(entry: IntersectionObserverEntry) => void} handler
 * @param {IntersectionObserverInit} [opts]
 * @url https://pota.quack.uy/use/intersection
 */
export const visible = (handler, opts) => node =>
	onVisible(node, handler, opts)

/**
 * Ref factory for `<img>`: swaps `src` from `data-src` (or `opts.src`)
 * the first time the element enters view, then disconnects.
 *
 * @param {{ src?: string; rootMargin?: string }} [opts]
 * @url https://pota.quack.uy/use/intersection
 */
export const lazyImage =
	(opts = {}) =>
	/** @param {HTMLImageElement} node */
	node => {
		const io = new IntersectionObserver(
			entries => {
				if (entries[0].isIntersecting) {
					const src = opts.src ?? node.dataset.src
					if (src) node.src = src
					io.disconnect()
				}
			},
			{ rootMargin: opts.rootMargin },
		)
		io.observe(node)
		cleanup(() => io.disconnect())
	}
