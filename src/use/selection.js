export function getSelection() {
	const selection = window.getSelection()
	if (!selection || selection.rangeCount === 0) {
		return null
	}
	return selection.getRangeAt(0)
}

export function restoreSelection(range) {
	if (range) {
		const selection = window.getSelection()
		selection.removeAllRanges()
		selection.addRange(range)
	}
}
