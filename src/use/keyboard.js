import { addEvent, signal } from '../lib/reactive.js'
import { window } from '../lib/std.js'
import { document } from './dom.js'
import { Emitter } from './emitter.js'
import { isEditable } from './form.js'

/**
 * Parses a chord like `"ctrl+shift+k"` into a comparator that accepts
 * a `KeyboardEvent`. Modifier order does not matter; key matching is
 * case-insensitive against `event.key`. Use `mod` as an alias for
 * `ctrl` on non-Mac and `meta` on Mac.
 *
 * @param {string} combo
 */
const parse = combo => {
	const parts = combo
		.toLowerCase()
		.split('+')
		.map(s => s.trim())
	const key = parts[parts.length - 1]
	const mods = new Set(parts.slice(0, -1))
	const isMac =
		typeof navigator !== 'undefined' &&
		/mac/i.test(navigator.platform)
	const wantMod = mods.has('mod')
	const wantCtrl = mods.has('ctrl') || (wantMod && !isMac)
	const wantMeta = mods.has('meta') || (wantMod && isMac)
	const wantAlt = mods.has('alt')
	const wantShift = mods.has('shift')
	/** @param {KeyboardEvent} e */
	return e =>
		e.key.toLowerCase() === key &&
		e.ctrlKey === wantCtrl &&
		e.metaKey === wantMeta &&
		e.altKey === wantAlt &&
		e.shiftKey === wantShift
}

/**
 * Ref factory: invokes `handler` when the given keyboard chord is
 * pressed while the element (or one of its descendants) has focus.
 * `combo` accepts `+`-separated modifiers — `ctrl`, `meta`, `alt`,
 * `shift`, `mod` (`ctrl` on non-Mac, `meta` on Mac) — followed by a
 * single key. Calls `preventDefault` when the chord matches.
 *
 * @param {string} combo
 * @param {(e: KeyboardEvent, node: Element) => void} handler
 * @url https://pota.quack.uy/use/keyboard
 */
export const shortcut = (combo, handler) => {
	const matches = parse(combo)
	return node =>
		addEvent(node, 'keydown', e => {
			if (matches(e)) {
				e.preventDefault()
				handler(e, node)
			}
		})
}

/**
 * Document-scoped variant of `shortcut`: fires the handler when the
 * chord is pressed anywhere in the document.
 *
 * @param {string} combo
 * @param {(e: KeyboardEvent) => void} handler
 * @url https://pota.quack.uy/use/keyboard
 */
export const globalShortcut = (combo, handler) => {
	const matches = parse(combo)
	return () =>
		addEvent(document, 'keydown', e => {
			if (matches(e)) {
				e.preventDefault()
				handler(e)
			}
		})
}

/**
 * Ref factory: invokes `handler` when `Ctrl+Enter` (or `Cmd+Enter` on
 * Mac) is pressed on the element. Useful for submit-on-shortcut in a
 * textarea.
 *
 * @param {(e: KeyboardEvent, node: Element) => void} handler
 * @url https://pota.quack.uy/use/keyboard
 */
export const submitOnCtrlEnter = handler =>
	shortcut('mod+enter', handler)

// ---- held-key tracking -------------------------------------------

/** @type {Map<string, SignalObject<boolean>>} */
const heldSignals = new Map()
/** @type {Set<string>} */
const heldSet = new Set()

const ensureHeldSignal = key => {
	let entry = heldSignals.get(key)
	if (!entry) {
		entry = signal(false)
		heldSignals.set(key, entry)
	}
	return entry
}

const clearAllHeld = () => {
	heldSet.clear()
	for (const [, sig] of heldSignals) sig.write(false)
}

const onKeyDown = e => {
	if (isEditable(document.activeElement)) return
	const k = e.key.toLowerCase()
	// skip OS key-repeat events so the signal flips only on
	// the actual press transition.
	if (heldSet.has(k)) return
	heldSet.add(k)
	ensureHeldSignal(k).write(true)
}
const onKeyUp = e => {
	const k = e.key.toLowerCase()
	if (!heldSet.has(k)) return
	heldSet.delete(k)
	ensureHeldSignal(k).write(false)
}

// Emitter refcounts the held-key listeners: the first `use()`
// attaches them on `window`; the last consumer's cleanup detaches
// them and clears `heldSet` so stale "held" state doesn't survive
// an off → on cycle. Listening on `window` (not via the
// scope-bound `addEvent`) keeps the tracker independent of any one
// reactive owner while it's alive.
const heldLifecycle = new Emitter({
	on: () => {
		window.addEventListener('keydown', onKeyDown)
		window.addEventListener('keyup', onKeyUp)
		// blur clears held keys so they can't stay "stuck" when the
		// user alt-tabs while holding one.
		window.addEventListener('blur', clearAllHeld)
		return () => {
			window.removeEventListener('keydown', onKeyDown)
			window.removeEventListener('keyup', onKeyUp)
			window.removeEventListener('blur', clearAllHeld)
			clearAllHeld()
		}
	},
})

/**
 * Reactive accessor for whether `key` is currently held down,
 * tracked globally (modifier-agnostic). Useful for game-style input,
 * canvas controls, or any UI driven by key-held state rather than
 * key-press events.
 *
 * Keydown is ignored while focus is inside an editable element
 * (`<input>`, `<textarea>`, `<select>`, or `contenteditable`) so
 * typing doesn't trip held state. Keyup is always honored so keys
 * can't get stuck. OS key-repeat events don't flip the signal — only
 * the actual press/release transitions do.
 *
 * `key` follows `KeyboardEvent.key` lowercased: `'a'`, `' '` for
 * space, `'arrowup'`, `'shift'`, etc.
 *
 * @param {string} key
 * @returns {() => boolean}
 * @url https://pota.quack.uy/use/keyboard
 */
export const useKeyHeld = key => {
	heldLifecycle.use()
	return ensureHeldSignal(key.toLowerCase()).read
}

/**
 * Non-reactive live `Set` of currently-held keys (lowercased). Reads
 * don't subscribe — intended for `requestAnimationFrame` loops where
 * reactive tracking would be wasted overhead. The set is mutated in
 * place by the tracker; treat it as read-only.
 *
 * @returns {Set<string>}
 * @url https://pota.quack.uy/use/keyboard
 */
export const keysHeld = () => {
	heldLifecycle.use()
	return heldSet
}
