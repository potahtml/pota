import { addEvent } from '../lib/reactive.js'
import { document } from './dom.js'

/**
 * Drag delta and origin information passed to drag callbacks.
 *
 * @typedef {{
 * 	dx: number
 * 	dy: number
 * 	x: number
 * 	y: number
 * 	originX: number
 * 	originY: number
 * 	event: PointerEvent
 * }} DragInfo
 */

/**
 * Ref factory: turns the element into a drag handle. `onMove` is
 * called on every `pointermove` between `pointerdown` and
 * `pointerup`/`pointercancel`, with the cumulative delta from the
 * starting position. `onStart` / `onEnd` fire at the start/end of
 * each drag gesture. Returns the ref function.
 *
 * @param {{
 * 	onMove: (info: DragInfo) => void
 * 	onStart?: (info: DragInfo) => void
 * 	onEnd?: (info: DragInfo) => void
 * }} opts
 * @url https://pota.quack.uy/use/drag
 */
export const draggable =
	({ onMove, onStart, onEnd }) =>
	/** @param {HTMLElement} node */
	node => {
		let originX = 0
		let originY = 0
		let pointerId = -1

		const onPointerMove = (/** @type {PointerEvent} */ e) => {
			if (e.pointerId !== pointerId) return
			const info = {
				dx: e.clientX - originX,
				dy: e.clientY - originY,
				x: e.clientX,
				y: e.clientY,
				originX,
				originY,
				event: e,
			}
			onMove(info)
		}

		const onPointerUp = (/** @type {PointerEvent} */ e) => {
			if (e.pointerId !== pointerId) return
			onEnd?.({
				dx: e.clientX - originX,
				dy: e.clientY - originY,
				x: e.clientX,
				y: e.clientY,
				originX,
				originY,
				event: e,
			})
			pointerId = -1
		}

		addEvent(node, 'pointerdown', e => {
			pointerId = e.pointerId
			originX = e.clientX
			originY = e.clientY
			onStart?.({
				dx: 0,
				dy: 0,
				x: originX,
				y: originY,
				originX,
				originY,
				event: e,
			})
		})

		// listen on document so the gesture continues even when the
		// pointer leaves the handle
		addEvent(document, 'pointermove', onPointerMove)
		addEvent(document, 'pointerup', onPointerUp)
		addEvent(document, 'pointercancel', onPointerUp)
	}
