import {
	addEvent,
	cleanup,
	signal,
	untrack,
} from '../lib/reactive.js'
import { Emitter } from './emitter.js'
import { createOverlay } from './overlay.js'

/** @typedef {import('./overlay.js').OverlayPosition} OverlayPosition */

// A single shared overlay backs every `tooltip(...)` ref factory
// call. The active trigger writes its config into the overlay's
// signals on show, and the overlay reactively renders/positions
// itself. Only one tooltip is visible at a time — matches how
// OS-native tooltips behave and avoids a per-trigger DOM pile-up.
//
// Lifecycle is managed by `Emitter`: the first `use()` creates the
// overlay; the last consumer's cleanup tears it down. The dispatched
// value is unused — the overlay api is exposed via the module-level
// `overlay` binding set inside `on`.

/** @type {ReturnType<typeof createSingleton> | null} */
let overlay = null

const createSingleton = () => {
	const opened = signal(false)
	const related = signal(/** @type {Element | null} */ (null))
	const content = signal(/** @type {unknown} */ (null))
	const position = signal(/** @type {OverlayPosition} */ ('top'))
	const arrows = signal(true)

	const dispose = createOverlay({
		role: 'tooltip',
		opened: opened.read,
		related: related.read,
		content: content.read,
		position: position.read,
		arrows: arrows.read,
	})

	return {
		show(opts) {
			related.write(opts.node)
			content.write(opts.content)
			position.write(opts.position)
			arrows.write(opts.arrows)
			opened.write(true)
		},
		hide() {
			opened.write(false)
		},
		isOpenFor(node) {
			return untrack(opened.read) && untrack(related.read) === node
		},
		dispose,
	}
}

const overlayLifecycle = new Emitter({
	on: () => {
		overlay = createSingleton()
		return () => {
			overlay?.dispose()
			overlay = null
		}
	},
})

/**
 * Ref factory: shows a singleton tooltip when the element is hovered
 * (`pointerenter`) or focused, and hides it on `pointerleave` /
 * `blur`. Only one tooltip is visible at a time — activating a
 * different trigger replaces the active one. Auto- repositions on
 * scroll and viewport resize.
 *
 * `opts.content` accepts a string, a JSX element, or a function /
 * signal accessor (reactive). `opts.position` is one of:
 *
 * - **Cardinals** (tooltip adjacent, centered on the trigger): `top`
 *   (default), `bottom`, `left`, `right`.
 * - **Plain corners** (tooltip diagonally past the trigger's corner):
 *   `top-left`, `top-right`, `bottom-left`, `bottom-right`.
 * - **Overlap corners** (tooltip adjacent on one axis, with the
 *   matching edges aligned): `top-left-overlap`, `top-right-overlap`,
 *   `bottom-left-overlap`, `bottom-right-overlap`.
 *
 * `opts.arrows` toggles the arrow indicator (default `true`).
 *
 * The shared overlay is refcounted — it appears on the first tooltip
 * mount and is removed when the last `tooltip` ref disposes.
 *
 * @param {{
 * 	content: unknown
 * 	position?: OverlayPosition
 * 	arrows?: boolean
 * }} opts
 * @url https://pota.quack.uy/use/tooltip
 */
export const tooltip =
	opts => /** @param {HTMLElement} node */ node => {
		overlayLifecycle.use()
		const show = () => {
			overlay?.show({
				node,
				content: opts.content,
				position: opts.position || 'top',
				arrows: opts.arrows ?? true,
			})
		}
		const hide = () => {
			// only close if we're the active trigger — guards against
			// blur on a previously-focused sibling closing the tooltip
			// the user is currently pointing at.
			if (overlay?.isOpenFor(node)) overlay.hide()
		}

		addEvent(node, 'pointerenter', show)
		addEvent(node, 'pointerleave', hide)
		addEvent(node, 'focus', show)
		addEvent(node, 'blur', hide)

		// hide when the trigger's owner scope tears down — otherwise a
		// tooltip can linger after its anchor is gone. LIFO cleanup
		// order in this scope runs this before `overlayLifecycle`'s
		// teardown, so `overlay` is still live here.
		cleanup(() => {
			if (overlay?.isOpenFor(node)) overlay.hide()
		})
	}
