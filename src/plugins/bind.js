// bind is a small helper for binding the value of an element to a signal
// https://pota.quack.uy/props/bind

import { $default } from '../constants.js'

import { signal } from '../lib/reactivity/primitives/solid.js'

import { microtask } from '../lib/std/microtask.js'
import {
	addEventListener,
	propsPlugin,
	propsPluginNS,
} from '../exports.js'

/**
 * To use in bind attribute.
 *
 * @param {any} value? - Initial value
 * @returns {Signal}
 */
export function bind(value) {
	const [read, write] = signal(value)
	return (v = $default) => (v !== $default ? write(v) : read())
}

/**
 * @param {Elements} node
 * @param {string} name
 * @param {Function} value
 * @param {object} props
 */
function bindValue(node, name, value, props) {
	// give time to the node to get a value from props
	microtask(() => {
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
	})
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
