// https://pota.quack.uy/props/plugins/useFullscreen

import {
	addEventListener,
	propsPlugin,
	propsPluginNS,
} from '../exports.js'
import { getValueElement } from '../lib/std/getValueElement.js'

/**
 * @param {Elements} node
 * @param {string} propName
 * @param {Function} propValue
 * @param {object} props
 */
const useFullscreen = (node, propName, propValue, props) =>
	addEventListener(node, 'click', e => {
		if (document.fullscreenElement) {
			document.exitFullscreen()
		} else {
			const element =
				getValueElement(propValue, e, node) ||
				document.documentElement
			element.requestFullscreen()
		}
	})

propsPlugin('useFullscreen', useFullscreen)
propsPluginNS('useFullscreen', useFullscreen)
