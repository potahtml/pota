import { isFunction } from '../lib/std.js'

import { copyToClipboard } from '../use/string.js'

import { addEvent } from '../lib/reactive.js'
import { propsPlugin } from '../core/props/plugin.js'

/**
 * @param {HTMLElement} node
 * @param {Function | boolean} value
 * @url https://pota.quack.uy/use/clipboard
 */
const clipboard = (node, value) =>
	addEvent(node, 'click', e => {
		copyToClipboard(
			isFunction(value)
				? value(e)
				: value !== true
					? value
					: node.innerText.trim(),
		)
	})

propsPlugin('use:clipboard', clipboard)
