import { addEvent, effect, derived } from '../lib/reactive.js'

import { propsPlugin } from '../core/props/plugin.js'
import { getSelection, restoreSelection } from './selection.js'
import { flatForEach, isFunction } from '../lib/std.js'

/**
 * To use in bind attribute on JSX elements.
 *
 * @template T
 * @param {T | (() => T)} [value] - Optional initial value that may be
 *   a computed
 * @returns {SignalFunction<Accessed<T>>}
 * @url https://pota.quack.uy/use/bind
 */
export const bind = value =>
	derived(isFunction(value) ? value : () => value)

/**
 * @param {HTMLInputElement} node
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

// @ts-expect-error
propsPlugin('use:bind', bindValue)
