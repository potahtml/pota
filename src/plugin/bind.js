import { addEvent, effect, signalFunction } from '../lib/reactive.js'

import { propsPlugin } from '../props/plugin.js'

/**
 * To use in bind attribute on JSX elements.
 *
 * @template T
 * @param {T} [value] - Optional initial value
 * @returns {SignalFunction<T>}
 * @url https://pota.quack.uy/plugin/bind
 */
export const bind = value => signalFunction(value)

/**
 * @param {Element} node
 * @param {string} name
 * @param {Function} value
 * @param {object} props
 */
function bindValue(node, name, value, props) {
	effect(() => {
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
					// todo retore selection
					node.innerText = value()
				} else {
					node.value = value()
				}
			}
		}
	})

	// listen for changes
	addEvent(node, 'input', e => {
		switch (node.type) {
			case 'checkbox': {
				value(node.checked)
				break
			}
			case 'radio': {
				node.checked && value(node.value)
				break
			}
			default: {
				value(node.isContentEditable ? node.innerText : node.value)
			}
		}
	})
}

propsPlugin('bind', bindValue)
