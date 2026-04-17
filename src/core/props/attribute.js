import { withValue } from '../../lib/reactive.js'

import { NS } from '../../constants.js'

// NODE ATTRIBUTES

/**
 * @param {Element} node
 * @param {string} name
 * @param {Accessor<string | number | boolean>} value
 * @url https://pota.quack.uy/props/setAttribute
 */
export const setAttribute = (node, name, value) => {
	withValue(value, value => _setAttribute(node, name, value))
}

/**
 * @param {Element} node
 * @param {string} name
 * @param {string | number | boolean} value
 */
function _setAttribute(node, name, value) {
	// if the value is false/null/undefined it will be removed
	value === false || value == null
		? node.removeAttribute(name)
		: node.setAttribute(
				name,
				value === true ? '' : /** @type {string} */ (value),
			)
}

/**
 * @param {Element} node
 * @param {string} name
 * @param {Accessor<string | number | boolean>} value
 * @param {string} ns
 * @url https://pota.quack.uy/props/setAttribute
 */
export const setAttributeNS = (node, name, value, ns) => {
	withValue(value, value => _setAttributeNS(node, name, value, ns))
}

/**
 * @param {Element} node
 * @param {string} name
 * @param {string | number | boolean} value
 * @param {string} ns
 */
function _setAttributeNS(node, name, value, ns) {
	// if the value is false/null/undefined it will be removed
	value === false || value == null
		? NS[ns]
			? node.removeAttributeNS(NS[ns], name)
			: node.removeAttribute(name)
		: NS[ns]
			? node.setAttributeNS(
					NS[ns],
					name,
					value === true ? '' : /** @type {string} */ (value),
				)
			: node.setAttribute(
					name,
					value === true ? '' : /** @type {string} */ (value),
				)
}
