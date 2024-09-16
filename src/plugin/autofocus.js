// https://pota.quack.uy/plugin/autofocus

import { propsPlugin } from '../props/plugin.js'

/**
 * @param {Element} node
 * @param {string} propName
 * @param {Function} propValue
 * @param {object} props
 */
const autofocus = (node, propName, propValue, props) => node.focus()

propsPlugin('autofocus', autofocus)
