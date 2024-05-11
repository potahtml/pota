import { $component } from '../../constants.js'

/**
 * Unwraps components till it gets a value. To keep context relevant
 * to the component
 *
 * @param {Function | any} value - Maybe function
 * @returns {any}
 */
export function getValueComponent(value) {
	while ($component in value) value = value()
	return value
}
