import { cleanup, withValue } from '../lib/reactive.js'
import { isNullUndefined } from '../lib/std.js'
import { _setProperty } from './property.js'

/**
 * `value` as a prop is special cased so the button `reset` in forms
 * works as expected. The first time a value is set, its done as an
 * attribute.
 */
export const setValue = (node, name, value) =>
	withValue(value, value => _setValue(node, name, value))

const defaults = new Set()

function _setValue(node, name, value) {
	if (!defaults.has(node)) {
		defaults.add(node)
		cleanup(() => defaults.delete(node))

		if (!isNullUndefined(value)) {
			switch (node.localName) {
				case 'input': {
					node.setAttribute('value', value)
					return
				}
				case 'textarea': {
					node.textContent = value
					return
				}
			}
		}
	}

	_setProperty(node, name, value)
}
