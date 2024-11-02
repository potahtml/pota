import { cleanup, withValue } from '../lib/reactive.js'
import { isNullUndefined } from '../lib/std.js'
import { _setUnknown } from './unknown.js'

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
			switch (node.tagName) {
				case 'INPUT': {
					node.setAttribute('value', value)
					return
				}
				case 'TEXTAREA': {
					node.textContent = value
					return
				}
			}
		}
	}

	if (!value && node.tagName === 'PROGRESS') {
		node.removeAttribute('value')
	} else {
		_setUnknown(node, name, value)
	}
}
