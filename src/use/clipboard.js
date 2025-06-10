import { isFunction } from '../lib/std.js'

import { copyToClipboard } from '../use/string.js'

import { addEvent } from '../lib/reactive.js'
import { propsPlugin } from '../core/props/plugin.js'

/**
 * @param {HTMLElement} node
 * @param {string} propName
 * @param {Function | boolean} propValue
 * @param {object} props
 * @url https://pota.quack.uy/use/clipboard
 */
const clipboard = (node, propName, propValue, props) =>
	addEvent(node, 'click', e => {
		copyToClipboard(
			isFunction(propValue)
				? propValue(e)
				: propValue !== true
					? propValue
					: node.innerText.trim(),
		)
	})

propsPlugin('plugin:clipboard', clipboard)
