import { withState } from '../../lib/std.js'
import { addAdoptedStyleSheet, sheet } from '../../use/css.js'
import {
	addClass,
	getDocumentForElement,
	isConnected,
} from '../../use/dom.js'

import { randomId } from '../../use/random.js'
import { onMount } from '../scheduler.js'

/**
 * @param {Element} node
 * @param {string} value
 */
export const setCSS = (node, value) => {
	isConnected(node)
		? setNodeCSS(node, value)
		: onMount(() => {
				setNodeCSS(node, value)
			})
}

/**
 * Matches `class` only where it stands as the placeholder token: not
 * inside a longer word (`.classic`, `class-name`, `my-class`), not as
 * a literal selector/attribute reference (`.class`, `#class`,
 * `[class*=…]`), and not opening a quoted string (`"class"`). Quoted
 * occurrences with surrounding text (`content: "a class"`) would need
 * a CSS tokenizer and are not handled.
 */
const classToken = /(?<![.#\["'\w-])class(?![\w-])/g

/** @type {(node: Element, value: string) => void} */
const setNodeCSS = withState((state, node, value) => {
	if (value) {
		const entry = state.get(value, value => {
			const id = 'c' + randomId()
			return {
				id,
				sheet: sheet(value.replace(classToken, '.' + id)),
			}
		})
		/**
		 * Outside the cache-miss factory — a cache hit coming from a
		 * different document/shadow root still needs the sheet adopted
		 * there. `addAdoptedStyleSheet` is idempotent per document.
		 */
		addAdoptedStyleSheet(getDocumentForElement(node), entry.sheet)
		addClass(node, entry.id)
	}
})
