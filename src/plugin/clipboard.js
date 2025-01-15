import { isFunction } from '../lib/std.js'

import { copyToClipboard } from '../plugin/useString.js'

import { addEvent } from '../lib/reactive.js'
import { propsPlugin } from '../props/plugin.js'

/**
 * @param {Element} node
 * @param {string} propName
 * @param {Function} propValue
 * @param {object} props
 * @url https://pota.quack.uy/plugin/clipboard
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
