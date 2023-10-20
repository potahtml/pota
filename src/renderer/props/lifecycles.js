import { $meta } from '../constants.js'
/**
 * @param {pota.element} node
 * @param {string} name
 * @param {Function | unknown} value
 * @param {object} props
 */
export function setOnMount(node, name, value, props) {
	const meta = node[$meta]
	meta.onMount = meta.onMount || []
	meta.onMount.push(value)
}
/**
 * @param {pota.element} node
 * @param {string} name
 * @param {Function | unknown} value
 * @param {object} props
 */
export function setOnCleanup(node, name, value, props) {
	const meta = node[$meta]
	meta.onCleanup = meta.onCleanup || []
	meta.onCleanup.push(value)
}
