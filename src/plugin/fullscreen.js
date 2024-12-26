// https://pota.quack.uy/plugin/fullscreen

import { getValueElement } from '../lib/std.js'

import { addEvent } from '../lib/reactive.js'
import { propsPlugin } from '../props/plugin.js'
import { toggleFullscreen } from './useFullscreen.js'

/**
 * @param {Element} node
 * @param {string} propName
 * @param {Function} propValue
 * @param {object} props
 */
const fullscreen = (node, propName, propValue, props) =>
	addEvent(node, 'click', e => {
		toggleFullscreen(getValueElement(propValue, e, node))
	})

propsPlugin('fullscreen', fullscreen)
