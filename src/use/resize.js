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
 * @url https://pota.quack.uy/use/resize
 */
export const useElementSize = node => getEmitter(node).use()

/**
 * Registers a callback fired on each resize for `node`. The callback
 * is **not** invoked with the pre-observer placeholder — only with
 * real `ResizeObserverEntry`s.
 *
 * @param {Element} node
 * @param {(entry: ResizeObserverEntry) => void} fn
 * @url https://pota.quack.uy/use/resize
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
