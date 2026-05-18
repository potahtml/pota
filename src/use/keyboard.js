import { addEvent } from '../lib/reactive.js'
import { document } from './dom.js'

/**
 * Parses a chord like `"ctrl+shift+k"` into a comparator that accepts
 * a `KeyboardEvent`. Modifier order does not matter; key matching is
 * case-insensitive against `event.key`. Use `mod` as an alias for
 * `ctrl` on non-Mac and `meta` on Mac.
 *
 * @param {string} combo
 */
const parse = combo => {
	const parts = combo.toLowerCase().split('+').map(s => s.trim())
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
