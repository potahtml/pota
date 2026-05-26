import { signal } from '../lib/reactive.js'
import { window } from '../lib/std.js'
import { Emitter } from './emitter.js'

// Backed by Pointer Events, not Mouse Events: pointerdown fires for
// every button (including back/forward, which mousedown skips in
// some browsers) and the API works for pen/touch too. Module name
// stays `mouse` because that's what callers reach for.

/** @type {Map<number, SignalObject<boolean>>} */
const buttonSignals = new Map()
/** @type {Set<number>} */
const heldButtons = new Set()
const posSignal = signal({ x: 0, y: 0 })

const ensureButtonSignal = button => {
	let entry = buttonSignals.get(button)
	if (!entry) {
		entry = signal(false)
		buttonSignals.set(button, entry)
	}
	return entry
}

const clearAllButtons = () => {
	heldButtons.clear()
	for (const [, sig] of buttonSignals) sig.write(false)
}

const onPointerDown = e => {
	if (heldButtons.has(e.button)) return
	heldButtons.add(e.button)
	ensureButtonSignal(e.button).write(true)
}
// pointerup and pointercancel do the same thing — release the button
// if it was held.
const onPointerRelease = e => {
	if (!heldButtons.has(e.button)) return
	heldButtons.delete(e.button)
	ensureButtonSignal(e.button).write(false)
}
const onPointerMove = e =>
	posSignal.write({ x: e.clientX, y: e.clientY })

// Emitter refcounts the pointer listeners: the first `use()`
// attaches them on `window`; the last consumer's cleanup detaches
// them and clears held buttons so stale state doesn't survive an
// off → on cycle. Listening on `window` (not via the scope-bound
// `addEvent`) keeps the tracker independent of any one reactive
// owner while it's alive.
const lifecycle = new Emitter({
	on: () => {
		window.addEventListener('pointerdown', onPointerDown)
		window.addEventListener('pointerup', onPointerRelease)
		window.addEventListener('pointercancel', onPointerRelease)
		window.addEventListener('pointermove', onPointerMove, {
			passive: true,
		})
		// safety net: window blur (alt-tab while holding) clears held
		// buttons so they don't get stuck.
		window.addEventListener('blur', clearAllButtons)
		return () => {
			window.removeEventListener('pointerdown', onPointerDown)
			window.removeEventListener('pointerup', onPointerRelease)
			window.removeEventListener('pointercancel', onPointerRelease)
			window.removeEventListener('pointermove', onPointerMove)
			window.removeEventListener('blur', clearAllButtons)
			clearAllButtons()
		}
	},
})

/**
 * Reactive accessor for whether a mouse button is currently held.
 * Button numbers follow `PointerEvent.button`:
 *
 * - `0` — primary (left)
 * - `1` — auxiliary (middle / wheel)
 * - `2` — secondary (right)
 * - `3` — back
 * - `4` — forward
 *
 * Tracking is global; first call lazily installs the listeners.
 * `pointerup` is honored unconditionally so buttons can't get
 * stuck, and `blur` clears all held buttons.
 *
 * @param {number} button
 * @returns {() => boolean}
 * @url https://pota.quack.uy/use/mouse
 */
export const useMouseButton = button => {
	lifecycle.use()
	return ensureButtonSignal(button).read
}

/**
 * Non-reactive live `Set` of currently-pressed button indices.
 * Intended for `requestAnimationFrame` loops where reactive
 * tracking would be wasted overhead. The set is mutated in place;
 * treat it as read-only.
 *
 * @returns {Set<number>}
 * @url https://pota.quack.uy/use/mouse
 */
export const mouseButtons = () => {
	lifecycle.use()
	return heldButtons
}

/**
 * Reactive accessor for the current pointer position in client
 * coordinates (`{x, y}`). For page coordinates, add the current
 * scroll offset; for element-relative coords, see
 * `pota/use/drag`'s `DragInfo`.
 *
 * @returns {() => { x: number; y: number }}
 * @url https://pota.quack.uy/use/mouse
 */
export const useMousePosition = () => {
	lifecycle.use()
	return posSignal.read
}

/**
 * Non-reactive snapshot of the current pointer position. Returns a
 * fresh `{x, y}` object — the underlying signal is replaced on
 * every move, so subsequent calls see the latest value.
 *
 * @returns {{ x: number; y: number }}
 * @url https://pota.quack.uy/use/mouse
 */
export const mousePosition = () => {
	lifecycle.use()
	return posSignal.read()
}
