// pasteTextPlain for forcing text/plain pasting
// https://pota.quack.uy/props/plugins/pasteTextPlain

import {
	addEventListener,
	propsPlugin,
	propsPluginNS,
} from '../exports.js'

/**
 * @param {Elements} node
 * @param {string} name
 * @param {Function} value
 * @param {object} props
 */
const pasteTextPlain = (node, name, value, props) =>
	addEventListener(node, 'paste', e => {
		e.preventDefault()
		document.execCommand(
			'insertText',
			false,
			e.clipboardData.getData('text/plain'),
		)
	})

propsPlugin('pasteTextPlain', pasteTextPlain)
propsPluginNS('pasteTextPlain', pasteTextPlain)
