import { signal } from '../lib/reactive.js'
import { createOverlay } from './overlay.js'

/** @typedef {import('./overlay.js').OverlayPosition} OverlayPosition */

/**
 * Creates an imperative floating popover controller anchored to a
 * related element. Useful when the content is driven by async form
 * flows, confirmations, or validation handlers rather than pointer /
 * focus refs.
 *
 * Each call creates an independent overlay instance. The panel is
 * rendered with `role="dialog"` and `tabindex="-1"`; focus moves to
 * it on open and is restored to the previously-focused element on
 * close (or on `dispose()` while open).
 *
 * Call `dispose()` when the controller is no longer needed.
 *
 * @returns {{
 * 	setRelated: (node: Element | null) => void
 * 	setContent: (content: unknown) => void
 * 	setPosition: (position: OverlayPosition) => void
 * 	setArrows: (arrows: boolean) => void
 * 	open: () => void
 * 	close: () => void
 * 	dispose: () => void
 * }}
 * @url https://pota.quack.uy/use/popover
 */
export const popover = () => {
	const opened = signal(false)
	const related = signal(/** @type {Element | null} */ (null))
	const content = signal(/** @type {unknown} */ (null))
	const position = signal(/** @type {OverlayPosition} */ ('top'))
	const arrows = signal(true)

	let disposed = false
	const disposeOverlay = createOverlay({
		opened: opened.read,
		related: related.read,
		content: content.read,
		position: position.read,
		arrows: arrows.read,
		manageFocus: true,
	})

	return {
		setRelated(node) {
			related.write(node)
		},
		setContent(next) {
			content.write(next)
		},
		setPosition(next) {
			position.write(next)
		},
		setArrows(next) {
			arrows.write(next)
		},
		open() {
			if (disposed) return
			opened.write(true)
		},
		close() {
			opened.write(false)
		},
		dispose() {
			if (disposed) return
			disposed = true
			disposeOverlay()
		},
	}
}
