import { signal } from '../lib/reactive.js'
import { window } from '../lib/std.js'

// Backed by Pointer Events, not Mouse Events: pointerdown fires for
// every button (including back/forward, which mousedown skips in
// some browsers) and the API works for pen/touch too. Module name
// stays `mouse` because that's what callers reach for.

/** @type {Map<number, [() => boolean, (v: boolean) => void]>} */
const buttonSignals = new Map()
/** @type {Set<number>} */
const heldButtons = new Set()
const [posRead, posWrite] = signal({ x: 0, y: 0 })
let initialized = false

const ensureButtonSignal = button => {
	let entry = buttonSignals.get(button)
	if (!entry) {
		const [read, write] = signal(false)
		entry = [read, write]
		buttonSignals.set(button, entry)
	}
	return entry
}

const clearAllButtons = () => {
	heldButtons.clear()
	for (const [, [, write]] of buttonSignals) write(false)
}

const init = () => {
	if (initialized) return
	initialized = true
	// page-lifetime tracking, attached on `window` (not via the
	// scope-bound `addEvent`) so the tracker stays independent of any
	// one reactive owner.
	window.addEventListener('pointerdown', e => {
		if (heldButtons.has(e.button)) return
		heldButtons.add(e.button)
		ensureButtonSignal(e.button)[1](true)
	})
	window.addEventListener('pointerup', e => {
		if (!heldButtons.has(e.button)) return
		heldButtons.delete(e.button)
		ensureButtonSignal(e.button)[1](false)
	})
	window.addEventListener('pointercancel', e => {
		if (!heldButtons.has(e.button)) return
		heldButtons.delete(e.button)
		ensureButtonSignal(e.button)[1](false)
	})
	window.addEventListener(
		'pointermove',
		e => posWrite({ x: e.clientX, y: e.clientY }),
		{ passive: true },
	)
	// safety net: window blur (alt-tab while holding) clears held
	// buttons so they don't get stuck.
	window.addEventListener('blur', clearAllButtons)
}

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
	init()
	return ensureButtonSignal(button)[0]
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
	init()
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
	init()
	return posRead
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
	init()
	return posRead()
}
