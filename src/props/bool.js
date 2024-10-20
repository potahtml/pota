// BOOL ATTRIBUTES

import { withValue } from '../lib/reactive.js'

/**
 * @param {Element} node
 * @param {string} name
 * @param {unknown} value
 * @param {object} props
 * @param {string} localName
 * @param {string} ns
 */
export const setBoolNS = (node, name, value, props, localName, ns) =>
	setBool(node, localName, value)

/**
 * @param {Element} node
 * @param {string} name
 * @param {unknown} value
 * @url https://pota.quack.uy/props/setBool
 */
export const setBool = (node, name, value) =>
	withValue(value, value => _setBool(node, name, value))

/**
 * @param {Element} node
 * @param {string} name
 * @param {unknown} value
 */
export const _setBool = (node, name, value) =>
	// if the value is falsy gets removed
	value ? node.setAttribute(name, '') : node.removeAttribute(name)
