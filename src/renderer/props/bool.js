import { withValue } from './withValue.js'

// BOOL ATTRIBUTES

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 * @param {object} props
 * @param {string} localName
 * @param {string} ns
 */
export const setBoolNS = (node, name, value, props, localName, ns) =>
	setBool(node, localName, value)

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 * @url https://pota.quack.uy/props/setBool
 */
export const setBool = (node, name, value) =>
	withValue(name, value, value => _setBool(node, name, value))

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 */
export const _setBool = (node, name, value) =>
	// if the value is falsy gets removed
	!value ? node.removeAttribute(name) : node.setAttribute(name, '')
