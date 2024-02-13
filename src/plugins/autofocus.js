// https://pota.quack.uy/props/plugins/autofocus

import { propsPlugin, propsPluginNS } from '../exports.js'

/**
 * @param {Elements} node
 * @param {string} propName
 * @param {Function} propValue
 * @param {object} props
 */
const autofocus = (node, propName, propValue, props) => node.focus()

propsPlugin('autofocus', autofocus)
propsPluginNS('autofocus', autofocus)
