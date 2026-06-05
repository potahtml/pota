import { Component, insert } from '../core/renderer.js'
import {
	addEvent,
	cleanup,
	effect,
	root,
	untrack,
} from '../lib/reactive.js'
import { queueMicrotask, window } from '../lib/std.js'
import {
	addAdoptedStyleSheet,
	removeAdoptedStyleSheet,
} from './css.js'
import { document } from './dom.js'

// Shared primitive for floating, anchored overlays — used by
// `pota/use/tooltip` and `pota/use/popover`. The caller owns the
// reactive state (opened, related, content, position, arrows); the
// overlay mounts a panel into `document.body`, repositions itself
// when any of those change, and tracks scroll/resize for the life
// of the overlay (the handlers untrack `opened` cheaply).
//
// A single refcounted stylesheet backs every instance; the last
// dispose detaches it.

const STYLE = /* css */ `
.pota-overlay-wrap {
	position: fixed;
	z-index: var(--overlay-z, 2147483646);
	pointer-events: none;
	width: fit-content;
	height: fit-content;
	top: var(--overlay-y, 0);
	left: var(--overlay-x, 0);
	box-sizing: border-box;
	--overlay-color: snow;
	--overlay-background: #282828;
	--overlay-arrow-size: 10px;
	--half: calc(50% - var(--overlay-arrow-size));
}

.pota-overlay-panel {
	margin: 6px;
	border-radius: 4px;
	padding: 10px;
	box-shadow: 0 0 7px 1px rgba(0, 0, 0, 0.1);
	color: var(--overlay-color);
	background: var(--overlay-background);
	border: 1px solid rgba(0, 0, 0, 0.2);
	font-size: 0.8rem;
	position: relative;
	box-sizing: border-box;
	pointer-events: auto;
}

.pota-overlay-panel[data-overlay-arrows='false']::after {
	display: none;
}
.pota-overlay-panel::after {
	content: '';
	position: absolute;
	border: var(--overlay-arrow-size) solid transparent;
}

.pota-overlay-panel[data-overlay-position='top']::after {
	top: 100%;
	left: var(--half);
	border-top-color: var(--overlay-background);
}
.pota-overlay-panel[data-overlay-position='bottom']::after {
	bottom: 100%;
	left: var(--half);
	border-bottom-color: var(--overlay-background);
}
.pota-overlay-panel[data-overlay-position='right']::after {
	top: var(--half);
	right: 100%;
	border-right-color: var(--overlay-background);
}
.pota-overlay-panel[data-overlay-position='left']::after {
	top: var(--half);
	left: 100%;
	border-left-color: var(--overlay-background);
}

.pota-overlay-panel[data-overlay-position='top-left']::after {
	top: 100%;
	right: 5%;
	border-top-color: var(--overlay-background);
}
.pota-overlay-panel[data-overlay-position='top-right']::after {
	top: 100%;
	left: 5%;
	border-top-color: var(--overlay-background);
}
.pota-overlay-panel[data-overlay-position='bottom-left']::after {
	bottom: 100%;
	right: 5%;
	border-bottom-color: var(--overlay-background);
}
.pota-overlay-panel[data-overlay-position='bottom-right']::after {
	bottom: 100%;
	left: 5%;
	border-bottom-color: var(--overlay-background);
}

.pota-overlay-panel[data-overlay-position='top-left-overlap']::after {
	top: 100%;
	left: 5%;
	border-top-color: var(--overlay-background);
}
.pota-overlay-panel[data-overlay-position='top-right-overlap']::after {
	top: 100%;
	right: 5%;
	border-top-color: var(--overlay-background);
}
.pota-overlay-panel[data-overlay-position='bottom-left-overlap']::after {
	bottom: 100%;
	left: 5%;
	border-bottom-color: var(--overlay-background);
}
.pota-overlay-panel[data-overlay-position='bottom-right-overlap']::after {
	bottom: 100%;
	right: 5%;
	border-bottom-color: var(--overlay-background);
}
`

const sheet = new CSSStyleSheet()
sheet.replaceSync(STYLE)

let sheetUsers = 0

const retainSheet = () => {
	if (++sheetUsers === 1) addAdoptedStyleSheet(document, sheet)
}

const releaseSheet = () => {
	if (sheetUsers > 0 && --sheetUsers === 0) {
		removeAdoptedStyleSheet(document, sheet)
	}
}

/**
 * @typedef {'top'
 * 	| 'bottom'
 * 	| 'left'
 * 	| 'right'
 * 	| 'top-left'
 * 	| 'top-right'
 * 	| 'bottom-left'
 * 	| 'bottom-right'
 * 	| 'top-left-overlap'
 * 	| 'top-right-overlap'
 * 	| 'bottom-left-overlap'
 * 	| 'bottom-right-overlap'} OverlayPosition
 */

/**
 * Position math: returns the wrap's top-left given the trigger rect,
 * the wrap rect, and the requested position.
 */
const computePosition = (r, t, pos) => {
	switch (pos) {
		case 'bottom':
			return {
				x: r.left + (r.width / 2 - t.width / 2),
				y: r.bottom,
			}
		case 'bottom-left':
			return { x: r.left - t.width, y: r.bottom }
		case 'bottom-left-overlap':
			return { x: r.left, y: r.bottom }
		case 'bottom-right':
			return { x: r.right, y: r.bottom }
		case 'bottom-right-overlap':
			return { x: r.right - t.width, y: r.bottom }
		case 'top-left':
			return { x: r.left - t.width, y: r.top - t.height }
		case 'top-left-overlap':
			return { x: r.left, y: r.top - t.height }
		case 'top-right':
			return { x: r.right, y: r.top - t.height }
		case 'top-right-overlap':
			return { x: r.right - t.width, y: r.top - t.height }
		case 'left':
			return {
				x: r.left - t.width,
				y: r.top + (r.height / 2 - t.height / 2),
			}
		case 'right':
			return {
				x: r.right,
				y: r.top + (r.height / 2 - t.height / 2),
			}
		default:
			return {
				x: r.left + (r.width / 2 - t.width / 2),
				y: r.top - t.height,
			}
	}
}

const normalizeString = value =>
	typeof value === 'string'
		? value
				.split('\n')
				.map(line => line.trim())
				.join('\n')
				.trim()
		: value

/**
 * Creates a floating overlay panel anchored to a related element.
 * Caller supplies accessors for the reactive state; the overlay
 * mounts a wrap+panel into `document.body`, repositions on every
 * change, and tracks scroll/resize for the lifetime of the overlay.
 * Returns a `dispose` that unmounts the overlay and releases the
 * shared stylesheet. `dispose` is idempotent.
 *
 * Panel role defaults to `'dialog'`. Position defaults via
 * `computePosition()`'s `default` branch (top). String content is
 * whitespace-normalized (trimmed line-by-line) before being rendered
 * or surfaced as `aria-label`.
 *
 * When `manageFocus` is set, the panel gets `tabindex="-1"`, focus
 * moves into it on open, and is restored to the previously-focused
 * element on close (or on dispose-while-open).
 *
 * Coordinates are clamped to the viewport — the wrap will not render
 * beyond the visible window. Clamping is naive: it does not flip the
 * requested position.
 *
 * @param {{
 * 	role?: string
 * 	opened: () => unknown
 * 	related: () => Element | null
 * 	content: () => unknown
 * 	position: () => OverlayPosition
 * 	arrows: () => unknown
 * 	ariaLabel?: () => string | null
 * 	manageFocus?: boolean
 * }} opts
 * @returns {() => void} Dispose
 * @url https://pota.quack.uy/use/overlay
 */
export const createOverlay = opts => {
	retainSheet()

	/** @type {HTMLElement | undefined} */
	let wrap
	/** @type {HTMLElement | undefined} */
	let panel
	/** @type {() => void} */
	let rootDispose = () => {}
	let disposed = false
	let pendingUpdate = false

	const readContent = () => normalizeString(opts.content())

	const ariaLabel =
		opts.ariaLabel ||
		(() => {
			const v = readContent()
			return typeof v === 'string' ? v : null
		})

	const updatePosition = () => {
		if (pendingUpdate) return
		const node = untrack(opts.related)
		if (!node || !untrack(opts.opened) || !wrap) return
		pendingUpdate = true

		// defer measurement to a microtask so any content/attribute
		// change has hit the DOM before we read its rect.
		queueMicrotask(() => {
			pendingUpdate = false
			const active = untrack(opts.related)
			if (!active || !untrack(opts.opened) || !wrap) return

			const t = wrap.getBoundingClientRect()
			let { x, y } = computePosition(
				active.getBoundingClientRect(),
				t,
				untrack(opts.position),
			)

			// naive viewport clamp — keep the wrap on-screen. Does not
			// flip the requested position; consumers wanting reflective
			// fallback should compute and override.
			const maxX = window.innerWidth - t.width
			const maxY = window.innerHeight - t.height
			if (maxX >= 0) x = Math.max(0, Math.min(x, maxX))
			if (maxY >= 0) y = Math.max(0, Math.min(y, maxY))

			wrap.style.setProperty('--overlay-x', x + 'px')
			wrap.style.setProperty('--overlay-y', y + 'px')
		})
	}

	root(dispose => {
		rootDispose = dispose

		const panelProps = {
			class: 'pota-overlay-panel',
			role: opts.role || 'dialog',
			'data-overlay-position': opts.position,
			// pota strips attrs whose value is boolean `false`, but the
			// arrow CSS keys off `data-overlay-arrows="false"` — coerce
			// so the attribute is always present.
			'data-overlay-arrows': () => (opts.arrows() ? 'true' : 'false'),
			'aria-label': ariaLabel,
			'use:ref': /** @param {HTMLElement} el */ el => {
				panel = el
			},
			children: readContent,
		}
		if (opts.manageFocus) panelProps.tabindex = -1

		insert(
			Component('div', {
				class: 'pota-overlay-wrap',
				'use:ref': /** @param {HTMLElement} el */ el => {
					wrap = el
				},
				'style:display': () => (opts.opened() ? 'block' : 'none'),
				children: Component('div', panelProps),
			}),
			document.body,
		)

		// reposition on every relevant signal change
		effect(() => {
			opts.opened()
			opts.related()
			opts.position()
			opts.content()
			updatePosition()
		})

		// scroll & resize tracking is wired once and stays for the life
		// of the overlay; the handler untracks `opened` to no-op when
		// closed. This avoids paying addEventListener/removeListener on
		// every open/close for the singleton tooltip's hover cycle.
		// Scroll uses `capture: true` so it fires for ancestor scrolls
		// too. `addEvent` cleanups are scoped to this root.
		const onMove = () => {
			if (untrack(opts.opened)) updatePosition()
		}
		addEvent(window, 'scroll', {
			handleEvent: onMove,
			passive: true,
			capture: true,
		})
		addEvent(window, 'resize', onMove)

		if (opts.manageFocus) {
			/** @type {HTMLElement | null} */
			let previousFocus = null

			effect(() => {
				if (opts.opened()) {
					previousFocus = /** @type {HTMLElement | null} */ (
						document.activeElement
					)
					// wait a microtask so the panel is rendered with
					// display:block before focus moves to it.
					queueMicrotask(() => {
						if (untrack(opts.opened)) panel?.focus?.()
					})
				} else if (previousFocus) {
					previousFocus.focus?.()
					previousFocus = null
				}
			})

			// dispose-while-open should still restore focus — the close
			// branch above only fires on explicit `opened → false`.
			cleanup(() => {
				if (untrack(opts.opened) && previousFocus) {
					previousFocus.focus?.()
					previousFocus = null
				}
			})
		}
	})

	return () => {
		if (disposed) return
		disposed = true
		rootDispose()
		releaseSheet()
	}
}
