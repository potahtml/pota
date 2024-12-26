// https://pota.quack.uy/plugin/clickOutside

import { addEvent } from '../lib/reactive.js'
import { propsPlugin } from '../props/plugin.js'

/**
 * @param {Element} node
 * @param {string} propName
 * @param {Function} propValue
 * @param {object} props
 */
const clickOutside = (node, propName, propValue, props) =>
	addEvent(document, 'pointerdown', e => {
		if (!node.contains(e.target)) {
			propValue(e, node)
		}
	})

propsPlugin('clickOutside', clickOutside)
