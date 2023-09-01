import { $meta } from '../constants.js'

export function setOnMount(node, name, value, props) {
	const meta = node[$meta]
	meta.onMount = meta.onMount || []
	meta.onMount.push(value)
}

export function setOnCleanup(node, name, value, props) {
	const meta = node[$meta]
	meta.onCleanup = meta.onCleanup || []
	meta.onCleanup.push(value)
}
