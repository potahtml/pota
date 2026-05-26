import { isFunction } from '../lib/std.js'

import { copyToClipboard } from '../use/string.js'

import { addEvent } from '../lib/reactive.js'
import { document } from './dom.js'

/**
 * Returns a ref function that copies text to the clipboard on click.
 *
 * - When `value` is a string or number, that value is copied.
 * - When `value` is a function, it is called with the click event and
 *   its return value is copied.
 * - When `value` is `true`, the element's trimmed `innerText` is
 *   copied.
 *
 * @param {((e: PointerEvent) => string | number)
 * 	| boolean
 * 	| string
 * 	| number} value
 * @url https://pota.quack.uy/use/clipboard
 */
export const clipboard = value => node =>
	addEvent(node, 'click', e => {
		copyToClipboard(
			/** @type {string} */ (
				isFunction(value)
					? value(e)
					: value !== true
						? value
						: /** @type {HTMLElement} */ (node).innerText.trim()
			),
		)
	})

/**
 * Ref factory: intercepts `paste` so only the clipboard's
 * `text/plain` portion is used — strips HTML styling, fonts, colors,
 * and embedded images out of the pasted content.
 *
 * Without a handler, the plain text is inserted at the current
 * selection on `<input>`, `<textarea>`, and `contenteditable` hosts;
 * an `input` event is dispatched so reactive bindings (`bind`, etc.)
 * see the change. With a handler, the default insertion is skipped
 * and the handler receives the plain text, the event, and the node —
 * useful when the caller wants to massage the text first.
 *
 * @param {(
 * 	text: string,
 * 	event: ClipboardEvent,
 * 	node: Element,
 * ) => void} [handler]
 * @url https://pota.quack.uy/use/clipboard
 */
export const pasteText = handler => node =>
	addEvent(node, 'paste', e => {
		const text = e.clipboardData?.getData('text/plain') ?? ''
		e.preventDefault()
		if (handler) {
			handler(text, e, node)
			return
		}
		if (
			node instanceof HTMLInputElement ||
			node instanceof HTMLTextAreaElement
		) {
			const start = node.selectionStart ?? node.value.length
			const end = node.selectionEnd ?? node.value.length
			node.setRangeText(text, start, end, 'end')
			// dispatch so `bind` and other input-listeners see the
			// programmatic edit
			node.dispatchEvent(new Event('input', { bubbles: true }))
		} else {
			// contenteditable host: execCommand is the only cross-
			// browser way to insert at the caret with undo support.
			document.execCommand('insertText', false, text)
		}
	})

/**
 * Ref factory: captures any files in the clipboard on `paste` (pasted
 * images, files copied from the OS file manager, etc.). `handler`
 * runs only when at least one file is present, and `preventDefault()`
 * is called so the host element doesn't also receive a textual
 * representation of the file.
 *
 * @param {(
 * 	files: File[],
 * 	event: ClipboardEvent,
 * 	node: Element,
 * ) => void} handler
 * @url https://pota.quack.uy/use/clipboard
 */
export const pasteFiles = handler => node =>
	addEvent(node, 'paste', e => {
		const files = Array.from(e.clipboardData?.files ?? [])
		if (files.length) {
			e.preventDefault()
			handler(files, e, node)
		}
	})
