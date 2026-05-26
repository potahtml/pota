import { Component, insert } from '../core/renderer.js'
import {
	addEvent,
	cleanup,
	effect,
	root,
	signal,
	untrack,
} from '../lib/reactive.js'
import { queueMicrotask, window } from '../lib/std.js'
import {
	addAdoptedStyleSheet,
	removeAdoptedStyleSheet,
} from './css.js'
import { document } from './dom.js'
import { Emitter } from './emitter.js'

// A single shared overlay backs every `tooltip(...)` ref factory
// call. The active trigger writes its config into the overlay's
// signals on show, and the overlay reactively renders/positions
// itself. Only one tooltip is visible at a time — matches how
// OS-native tooltips behave and avoids a per-trigger DOM pile-up.
//
// Lifecycle is managed by `Emitter`: the first `use()` creates the
// overlay; the last consumer's cleanup tears it down (DOM +
// stylesheet + listeners). The dispatched value is unused — the
// overlay api is exposed via a module-level binding set inside `on`.

const STYLE = /* css */ `
.pota-tt-wrap {
	position: fixed;
	z-index: 2147483646;
	pointer-events: none;
	width: fit-content;
	height: fit-content;
	top: var(--tooltip-y, 0);
	left: var(--tooltip-x, 0);
	box-sizing: border-box;
	--tooltip-color: snow;
	--tooltip-background: #282828;
	--tooltip-arrow-size: 10px;
	--half: calc(50% - var(--tooltip-arrow-size));
}

.pota-tt-inner {
	margin: 6px;
	border-radius: 4px;
	padding: 10px;
	box-shadow: 0 0 7px 1px rgba(0, 0, 0, 0.1);
	color: var(--tooltip-color);
	background: var(--tooltip-background);
	border: 1px solid rgba(0, 0, 0, 0.2);
	font-size: 0.8rem;
	position: relative;
	box-sizing: border-box;
}

/* ARROWS */
.pota-tt-inner[data-tooltip-arrows='false']::after {
	display: none;
}
.pota-tt-inner::after {
	content: '';
	position: absolute;
	border: var(--tooltip-arrow-size) solid transparent;
}

.pota-tt-inner[data-tooltip-position='top']::after {
	top: 100%;
	left: var(--half);
	border-top-color: var(--tooltip-background);
}
.pota-tt-inner[data-tooltip-position='bottom']::after {
	bottom: 100%;
	left: var(--half);
	border-bottom-color: var(--tooltip-background);
}
.pota-tt-inner[data-tooltip-position='right']::after {
	top: var(--half);
	right: 100%;
	border-right-color: var(--tooltip-background);
}
.pota-tt-inner[data-tooltip-position='left']::after {
	top: var(--half);
	left: 100%;
	border-left-color: var(--tooltip-background);
}

/* CORNERS — plain (tooltip placed diagonally past the corner).
   The arrow sits on the tooltip edge closest to the trigger,
   pointing in along the vertical axis. */
.pota-tt-inner[data-tooltip-position='top-left']::after {
	top: 100%;
	right: 5%;
	border-top-color: var(--tooltip-background);
}
.pota-tt-inner[data-tooltip-position='top-right']::after {
	top: 100%;
	left: 5%;
	border-top-color: var(--tooltip-background);
}
.pota-tt-inner[data-tooltip-position='bottom-left']::after {
	bottom: 100%;
	right: 5%;
	border-bottom-color: var(--tooltip-background);
}
.pota-tt-inner[data-tooltip-position='bottom-right']::after {
	bottom: 100%;
	left: 5%;
	border-bottom-color: var(--tooltip-background);
}

/* CORNERS — overlap (tooltip placed adjacent on one axis, with
   the matching edges aligned). */
.pota-tt-inner[data-tooltip-position='top-left-overlap']::after {
	top: 100%;
	left: 5%;
	border-top-color: var(--tooltip-background);
}
.pota-tt-inner[data-tooltip-position='top-right-overlap']::after {
	top: 100%;
	right: 5%;
	border-top-color: var(--tooltip-background);
}
.pota-tt-inner[data-tooltip-position='bottom-left-overlap']::after {
	bottom: 100%;
	left: 5%;
	border-bottom-color: var(--tooltip-background);
}
.pota-tt-inner[data-tooltip-position='bottom-right-overlap']::after {
	bottom: 100%;
	right: 5%;
	border-bottom-color: var(--tooltip-background);
}
`

/** @type {ReturnType<typeof createOverlay> | null} */
let overlay = null

const createOverlay = () => {
	const [opened, setOpened] = signal(false)
	const [related, setRelated] = signal(
		/** @type {Element | null} */ (null),
	)
	const [content, setContent] = signal(
		/** @type {unknown} */ (null),
	)
	const [position, setPosition] = signal('top')
	const [arrows, setArrows] = signal(true)

	/** @type {HTMLElement} */
	let wrap
	/** @type {() => void} */
	let rootDispose = () => {}

	const sheet = new CSSStyleSheet()
	sheet.replaceSync(STYLE)
	addAdoptedStyleSheet(document, sheet)

	const updatePosition = () => {
		const node = untrack(related)
		if (!node || !untrack(opened) || !wrap) return
		// measurement is deferred to a microtask so any content
		// change has hit the DOM before we read its rect.
		queueMicrotask(() => {
			const r = node.getBoundingClientRect()
			const t = wrap.getBoundingClientRect()
			const pos = untrack(position)
			let x, y

			switch (pos) {
				case 'bottom':
					x = r.left + (r.width / 2 - t.width / 2)
					y = r.bottom
					break
				case 'bottom-left':
					x = r.left - t.width
					y = r.bottom
					break
				case 'bottom-left-overlap':
					x = r.left
					y = r.bottom
					break
				case 'bottom-right':
					x = r.right
					y = r.bottom
					break
				case 'bottom-right-overlap':
					x = r.right - t.width
					y = r.bottom
					break
				case 'top-left':
					x = r.left - t.width
					y = r.top - t.height
					break
				case 'top-left-overlap':
					x = r.left
					y = r.top - t.height
					break
				case 'top-right':
					x = r.right
					y = r.top - t.height
					break
				case 'top-right-overlap':
					x = r.right - t.width
					y = r.top - t.height
					break
				case 'left':
					x = r.left - t.width
					y = r.top + (r.height / 2 - t.height / 2)
					break
				case 'right':
					x = r.right
					y = r.top + (r.height / 2 - t.height / 2)
					break
				case 'top':
				default:
					x = r.left + (r.width / 2 - t.width / 2)
					y = r.top - t.height
					break
			}

			wrap.style.setProperty('--tooltip-x', x + 'px')
			wrap.style.setProperty('--tooltip-y', y + 'px')
		})
	}

	// detached root: the overlay lives independent of any one
	// consumer's reactive scope; the refcount in `subscribe()`
	// drives `rootDispose()` when the last consumer goes away.
	root(dispose => {
		rootDispose = dispose
		insert(
			Component('div', {
				class: 'pota-tt-wrap',
				'use:ref': /** @param {HTMLElement} el */ el => {
					wrap = el
				},
				'style:display': () => (opened() ? 'block' : 'none'),
				children: Component('div', {
					class: 'pota-tt-inner',
					role: 'tooltip',
					'data-tooltip-position': position,
					// pota removes attrs set to boolean `false`, but
					// the CSS keys off `data-tooltip-arrows="false"`. Coerce
					// so the attribute is always present with an
					// explicit value.
					'data-tooltip-arrows': () =>
						arrows() ? 'true' : 'false',
					'aria-label': () =>
						typeof content() === 'string' ? content() : null,
					children: content,
				}),
			}),
			document.body,
		)

		// recompute position on every relevant signal change
		effect(() => {
			opened()
			related()
			position()
			content()
			updatePosition()
		})

		// scroll & resize while open. Scroll uses `capture: true` so
		// it fires for scrolls on any ancestor (scroll doesn't
		// bubble). `addEvent` cleanups are scoped to this root, so
		// `rootDispose()` removes both listeners.
		const onSurfaceMove = () => {
			if (untrack(opened)) updatePosition()
		}
		addEvent(window, 'scroll', {
			handleEvent: onSurfaceMove,
			passive: true,
			capture: true,
		})
		addEvent(window, 'resize', onSurfaceMove)
	})

	return {
		show(opts) {
			setRelated(opts.node)
			setContent(opts.content)
			setPosition(opts.position)
			setArrows(opts.arrows)
			setOpened(true)
		},
		hide() {
			setOpened(false)
		},
		isOpenFor(node) {
			return untrack(opened) && untrack(related) === node
		},
		dispose() {
			rootDispose()
			wrap?.remove()
			removeAdoptedStyleSheet(document, sheet)
		},
	}
}

// Emitter manages the refcounted singleton: the first `use()`
// creates the overlay; the last consumer's cleanup tears it down.
// The dispatched value is unused — `overlay` is exposed via the
// module-level binding instead, to spare every event handler an
// extra signal read.
const overlayLifecycle = new Emitter({
	on: () => {
		overlay = createOverlay()
		return () => {
			overlay?.dispose()
			overlay = null
		}
	},
})

/**
 * Ref factory: shows a singleton tooltip when the element is
 * hovered (`pointerenter`) or focused, and hides it on
 * `pointerleave` / `blur`. Only one tooltip is visible at a time —
 * activating a different trigger replaces the active one. Auto-
 * repositions on scroll and viewport resize.
 *
 * `opts.content` accepts a string, a JSX element, or a function /
 * signal accessor (reactive). `opts.position` is one of:
 *
 * - **Cardinals** (tooltip adjacent, centered on the trigger):
 *   `top` (default), `bottom`, `left`, `right`.
 * - **Plain corners** (tooltip diagonally past the trigger's
 *   corner): `top-left`, `top-right`, `bottom-left`,
 *   `bottom-right`.
 * - **Overlap corners** (tooltip adjacent on one axis, with the
 *   matching edges aligned): `top-left-overlap`,
 *   `top-right-overlap`, `bottom-left-overlap`,
 *   `bottom-right-overlap`.
 *
 * `opts.arrows` toggles the arrow indicator (default `true`).
 *
 * The shared overlay is refcounted — it appears on the first
 * tooltip mount and is removed when the last `tooltip` ref
 * disposes.
 *
 * @param {{
 * 	content: unknown
 * 	position?: string
 * 	arrows?: boolean
 * }} opts
 * @url https://pota.quack.uy/use/tooltip
 */
export const tooltip = opts => /** @param {HTMLElement} node */ node => {
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
