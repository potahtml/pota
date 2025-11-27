import { isFunction } from '../lib/std.js'

import { copyToClipboard } from '../use/string.js'

import { addEvent } from '../lib/reactive.js'
import { propsPlugin } from '../core/props/plugin.js'

/**
 * @param {DOMElement} node
 * @param {((e: EventEvent<EventType['click'], DOMElement>) => string)
 * 	| boolean
 * 	| string} value
 * @url https://pota.quack.uy/use/clipboard
 */
const clipboard = (node, value) =>
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

propsPlugin('use:clipboard', clipboard)
