// bind is a small helper for binding the value of an element to a signal
// https://pota.quack.uy/props/plugins/bind

import {
	addEventListener,
	propsPlugin,
	propsPluginNS,
} from '../exports.js'

export {
	/**
	 * To use in bind attribute on JSX elements.
	 *
	 * @param {any} [value] - Initial value
	 * @returns {Signal}
	 * @url https://pota.quack.uy/props/plugins/bind
	 */
	functionSignal as bind,
} from '../lib/reactivity/functionSignal.js'

/**
 * @param {Elements} node
 * @param {string} name
 * @param {Function} value
 * @param {object} props
 */
function bindValue(node, name, value, props) {
	// set initial value
	switch (node.type) {
		case 'checkbox': {
			node.checked = value()
			break
		}
		case 'radio': {
			node.checked = node.value == value()
			break
		}
		default: {
			if (node.isContentEditable) {
				node.innerText = value()
			} else {
				node.value = value()
			}
		}
	}

	// listen for changes
	addEventListener(node, 'input', e => {
		switch (node.type) {
			case 'checkbox': {
				value(node.checked)
				break
			}
			case 'radio': {
				if (node.checked) value(node.value)
				break
			}
			default: {
				value(node.isContentEditable ? node.innerText : node.value)
			}
		}
	})
}

propsPlugin('bind', bindValue)
propsPluginNS('bind', bindValue)
