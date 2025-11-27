import { window } from '../lib/std.js'

/**
 * Returns the current DOM Range selection or `null` if nothing is
 * selected.
 *
 * @returns {Range | null}
 */
export function getSelection() {
	const selection = window.getSelection()
	if (!selection || selection.rangeCount === 0) {
		return null
	}
	return selection.getRangeAt(0)
}

/**
 * Restores a previously captured DOM Range selection.
 *
 * @param {Range | null | undefined} range
 * @returns {void}
 */
export function restoreSelection(range) {
	if (range) {
		const selection = window.getSelection()
		selection.removeAllRanges()
		selection.addRange(range)
	}
}
