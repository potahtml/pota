// @ts-nocheck
import {
	addEvent,
	effect,
	signalFunction,
	writable,
} from '../lib/reactive.js'

import { propsPlugin } from '../core/props/plugin.js'
import { getSelection, restoreSelection } from './selection.js'
import { flatForEach } from '../lib/std.js'

/**
 * To use in bind attribute on JSX elements.
 *
 * @template T
 * @param {T} [value] - Optional initial value
 * @returns {SignalFunction<Accessed<T>>}
 * @url https://pota.quack.uy/use/bind
 */
export const bind = value => writable(value)

/**
 * @param {Element} node
 * @param {Function} value
 */
function bindValue(node, value) {
	flatForEach(value, value => {
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
						if (node.innerText !== value()) {
							const selection = getSelection()
							node.innerText = value()
							restoreSelection(selection)
						}
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
	})
}

propsPlugin('use:bind', bindValue)
