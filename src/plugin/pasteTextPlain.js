// pasteTextPlain for forcing text/plain pasting
// https://pota.quack.uy/plugin/pasteTextPlain

import { document, preventDefault } from '../lib/std.js'

import { addEventListener } from '../lib/reactive.js'
import { propsPlugin } from '../props/plugin.js'

/**
 * @param {Element} node
 * @param {string} name
 * @param {Function} value
 * @param {object} props
 */
const pasteTextPlain = (node, name, value, props) =>
	addEventListener(node, 'paste', e => {
		preventDefault(e)
		document.execCommand(
			'insertText',
			false,
			e.clipboardData.getData('text/plain'),
		)
	})

propsPlugin('pasteTextPlain', pasteTextPlain)
