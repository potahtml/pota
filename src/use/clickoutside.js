import { addEvent } from '../lib/reactive.js'
import { propsPlugin } from '../core/props/plugin.js'
import { document } from './dom.js'

/**
 * @param {Element} node
 * @param {Function} value
 * @url https://pota.quack.uy/use/clickoutside
 */
const clickoutside = (node, value, once = false) =>
	addEvent(document, 'pointerdown', {
		handleEvent(e) {
			if (!node.contains(/** @type {Element} */ (e.target))) {
				value(e, node)
			}
		},
		once,
	})

propsPlugin('use:clickoutside', clickoutside)
propsPlugin('use:clickoutsideonce', (node, value) =>
	clickoutside(node, value, true),
)
