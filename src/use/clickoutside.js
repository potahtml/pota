import { addEvent } from '../lib/reactive.js'
import { propsPlugin } from '../core/props/plugin.js'
import { document } from './dom.js'

/**
 * @param {Element} node
 * @param {Function} value
 * @url https://pota.quack.uy/use/clickoutside
 */
const clickoutside = (node, value) =>
	addEvent(document, 'pointerdown', e => {
		if (!node.contains(/** @type {Element} */ (e.target))) {
			value(e, node)
		}
	})

propsPlugin('use:clickoutside', clickoutside)
