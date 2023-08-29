import { $meta } from '../constants.js'

export function setOnMount(node, name, value, props) {
	node[$meta].onMount = node[$meta].onMount || []
	node[$meta].onMount.push(value)
}

export function setOnCleanup(node, name, value, props) {
	node[$meta].onCleanup = node[$meta].onCleanup || []
	node[$meta].onCleanup.push(value)
}
