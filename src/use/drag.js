import { addEvent } from '../lib/reactive.js'
import { document } from './dom.js'

/**
 * Drag delta and origin information passed to drag callbacks.
 *
 * `elementX` / `elementY` are pointer coordinates relative to the
 * element's top-left corner at the moment of `pointerdown`, clamped
 * to the element's box. `percentX` / `percentY` are the same values
 * expressed as `0`–`100`. Both are convenient for sliders, range
 * pickers, and color canvases — where the element doesn't move during
 * the gesture and the pointer position within its bounds is what
 * matters. Use `dx` / `dy` (cumulative delta) when dragging the
 * element itself.
 *
 * @typedef {{
 * 	dx: number
 * 	dy: number
 * 	x: number
 * 	y: number
 * 	originX: number
 * 	originY: number
 * 	elementX: number
 * 	elementY: number
 * 	percentX: number
 * 	percentY: number
 * 	event: PointerEvent
 * }} DragInfo
 */

/**
 * Ref factory: turns the element into a drag handle. `onMove` is
 * called on every `pointermove` between `pointerdown` and
 * `pointerup`/`pointercancel`, with the cumulative delta from the
 * starting position and the pointer position relative to the
 * element's box at the start of the gesture (see {@link DragInfo}).
 * `onStart` / `onEnd` fire at the start/end of each drag gesture.
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
		let rectX = 0
		let rectY = 0
		let rectW = 0
		let rectH = 0
		let pointerId = -1

		const buildInfo = (/** @type {PointerEvent} */ e) => {
			const elementX = Math.max(0, Math.min(rectW, e.clientX - rectX))
			const elementY = Math.max(0, Math.min(rectH, e.clientY - rectY))
			return {
				dx: e.clientX - originX,
				dy: e.clientY - originY,
				x: e.clientX,
				y: e.clientY,
				originX,
				originY,
				elementX,
				elementY,
				percentX: rectW ? (elementX / rectW) * 100 : 0,
				percentY: rectH ? (elementY / rectH) * 100 : 0,
				event: e,
			}
		}

		const onPointerMove = (/** @type {PointerEvent} */ e) => {
			if (e.pointerId !== pointerId) return
			onMove(buildInfo(e))
		}

		const onPointerUp = (/** @type {PointerEvent} */ e) => {
			if (e.pointerId !== pointerId) return
			onEnd?.(buildInfo(e))
			pointerId = -1
		}

		addEvent(node, 'pointerdown', e => {
			pointerId = e.pointerId
			originX = e.clientX
			originY = e.clientY
			// snapshot the rect once per gesture: element-relative
			// coords stay meaningful even if the element moves while
			// dragging.
			const rect = node.getBoundingClientRect()
			rectX = rect.left
			rectY = rect.top
			rectW = rect.width
			rectH = rect.height
			onStart?.(buildInfo(e))
		})

		// listen on document so the gesture continues even when the
		// pointer leaves the handle
		addEvent(document, 'pointermove', onPointerMove)
		addEvent(document, 'pointerup', onPointerUp)
		addEvent(document, 'pointercancel', onPointerUp)
	}
