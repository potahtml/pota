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
 * @url https://pota.quack.uy/use/intersection/useVisible
 */
export const useVisible = (node, opts) => getEmitter(node, opts).use()

/**
 * Registers a callback fired on each intersection change for `node`.
 * The callback is **not** invoked with the pre-observer placeholder —
 * only with real `IntersectionObserverEntry`s.
 *
 * With `opts.once`, the subscription auto-unsubscribes after the
 * first entry where `isIntersecting` is `true` (entries that fire on
 * exit are ignored). Useful for lazy-load / reveal-on-scroll where
 * you only care about the first arrival into view.
 *
 * @param {Element} node
 * @param {(entry: IntersectionObserverEntry) => void} fn
 * @param {IntersectionObserverInit & { once?: boolean }} [opts]
 * @url https://pota.quack.uy/use/intersection/onVisible
 */
export const onVisible = (node, fn, opts) => {
	let fired = false
	getEmitter(node, opts).on(entry => {
		if (entry === undefined) return
		if (opts?.once) {
			if (fired || !entry.isIntersecting) return
			fired = true
		}
		fn(entry)
	})
}

/**
 * Ref factory: invokes `handler` with the latest
 * `IntersectionObserverEntry` whenever the element's intersection
 * with the viewport (or `opts.root`) changes. Pass `opts.once` to
 * fire only on first intersection and then auto-unsubscribe.
 *
 * @param {(entry: IntersectionObserverEntry) => void} handler
 * @param {IntersectionObserverInit & { once?: boolean }} [opts]
 * @url https://pota.quack.uy/use/intersection/visible
 */
export const visible = (handler, opts) => node =>
	onVisible(node, handler, opts)

/**
 * Ref factory for `<img>`: swaps `src` from `data-src` (or
 * `opts.src`) the first time the element enters view, then
 * disconnects.
 *
 * @param {{ src?: string; rootMargin?: string }} [opts]
 * @url https://pota.quack.uy/use/intersection/lazyImage
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
