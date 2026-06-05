import { setElementStyle } from '../core/props/style.js'
import { onMount } from '../core/scheduler.js'
import { syncEffect } from '../lib/reactive.js'
import { weakStore, window } from '../lib/std.js'
import { documentElement } from './dom.js'
import { Emitter } from './emitter.js'
import {
	addEventNative,
	passiveEvent,
	removeEventNative,
} from './event.js'

/**
 * Returns the viewport dimensions of the document element.
 *
 * @returns {{ width: number; height: number }}
 * @url https://pota.quack.uy/use/resize/documentSize
 */
export const documentSize = () => ({
	width: documentElement.clientWidth,
	height: documentElement.clientHeight,
})

export const { on: onDocumentSize, use: useDocumentSize } =
	new Emitter({
		on: dispatch => {
			const handler = passiveEvent(() => dispatch(documentSize()))

			addEventNative(window, 'resize', handler)

			return () => {
				removeEventNative(window, 'resize', handler)
			}
		},
		initialValue: documentSize,
	})

// element-level resize (ResizeObserver)

const emitters = weakStore()

/**
 * @param {Element} node
 * @returns {Emitter<ResizeObserverEntry>}
 */
const getEmitter = node =>
	emitters.get(
		node,
		() =>
			new Emitter({
				on: dispatch => {
					const ro = new ResizeObserver(entries =>
						dispatch(entries[0]),
					)
					ro.observe(node)
					return () => ro.disconnect()
				},
			}),
	)

/**
 * Returns a signal accessor that reflects the latest
 * `ResizeObserverEntry` for `node`. Multiple subscribers on the same
 * node share one observer.
 *
 * @param {Element} node
 * @url https://pota.quack.uy/use/resize/useElementSize
 */
export const useElementSize = node => getEmitter(node).use()

/**
 * Registers a callback fired on each resize for `node`. The callback
 * is **not** invoked with the pre-observer placeholder — only with
 * real `ResizeObserverEntry`s.
 *
 * @param {Element} node
 * @param {(entry: ResizeObserverEntry) => void} fn
 * @url https://pota.quack.uy/use/resize/onElementSize
 */
export const onElementSize = (node, fn) =>
	getEmitter(node).on(entry => {
		if (entry !== undefined) fn(entry)
	})

/**
 * Ref factory: invokes `handler` with the latest
 * `ResizeObserverEntry` whenever the element resizes.
 *
 * @param {(entry: ResizeObserverEntry) => void} handler
 * @url https://pota.quack.uy/use/resize
 */
export const resize = handler => node => onElementSize(node, handler)

/**
 * Ref factory: keeps the element's right and bottom edges inside the
 * viewport by clamping `max-width` / `max-height` whenever the
 * viewport shrinks past the element's natural bounds. The element's
 * top-left anchor is sampled **once** at ref attach via
 * `getBoundingClientRect`, so this fits floating panels — popovers,
 * dropdowns, color pickers — whose anchor doesn't move during their
 * lifetime. If the anchor moves, drop and re-attach the ref.
 *
 * @param {HTMLElement} node
 * @url https://pota.quack.uy/use/resize/ensureInBounds
 */
export const ensureInBounds = node => {
	const size = useDocumentSize()
	// `getBoundingClientRect` only returns meaningful values once the
	// element is connected, so the rect snapshot and the clamp effect
	// are deferred to `onMount` (priority 2, after `onProps` where
	// refs fire).
	onMount(() => {
		const rect = node.getBoundingClientRect()
		syncEffect(() => {
			const { width, height } = size()
			setElementStyle(
				node,
				'max-width',
				rect.right > width ? width - rect.left + 'px' : null,
			)
			setElementStyle(
				node,
				'max-height',
				rect.bottom > height ? height - rect.top + 'px' : null,
			)
		})
	})
}
