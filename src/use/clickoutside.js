import { addEvent } from '../lib/reactive.js'
import { propsPlugin } from '../core/props/plugin.js'

/**
 * @param {Element} node
 * @param {string} propName
 * @param {Function} propValue
 * @param {object} props
 * @url https://pota.quack.uy/use/clickoutside
 */
const clickoutside = (node, propName, propValue, props) =>
	addEvent(document, 'pointerdown', e => {
		if (!node.contains(/** @type {Element} */ (e.target))) {
			propValue(e, node)
		}
	})

propsPlugin('plugin:clickoutside', clickoutside)
