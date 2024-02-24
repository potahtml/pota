// https://pota.quack.uy/props/plugins/onClickOutside

import {
	addEventListener,
	propsPlugin,
	propsPluginNS,
} from '../@main.js'

/**
 * @param {Elements} node
 * @param {string} propName
 * @param {Function} propValue
 * @param {object} props
 */
const onClickOutside = (node, propName, propValue, props) =>
	addEventListener(document, 'pointerdown', e => {
		if (!node.contains(e.target)) {
			propValue(e, node)
		}
	})

propsPlugin('onClickOutside', onClickOutside)
propsPluginNS('onClickOutside', onClickOutside)
