// https://pota.quack.uy/props/plugins/useClipboard

import {
	addEventListener,
	propsPlugin,
	propsPluginNS,
} from '../@main.js'
import { isFunction } from '../lib/std/isFunction.js'
import { copyToClipboard } from '../lib/strings/copyToClipboard.js'

/**
 * @param {Elements} node
 * @param {string} propName
 * @param {Function} propValue
 * @param {object} props
 */
const useClipboard = (node, propName, propValue, props) =>
	addEventListener(node, 'click', e => {
		copyToClipboard(
			isFunction(propValue)
				? propValue(node)
				: propValue !== true
					? propValue
					: node.innerText.trim(),
		)
	})

propsPlugin('useClipboard', useClipboard)
propsPluginNS('useClipboard', useClipboard)
