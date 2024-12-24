import { addEventListener, ownedEvent } from '../lib/reactive.js'

/**
 * @param {Element} node
 * @param {string} name
 * @param {EventListenerOrEventListenerObject} value
 * @param {object} props
 * @param {string} localName
 * @param {string} ns
 */
export const setEventNS = (node, name, value, props, localName, ns) =>
	// `value &&` because avoids crash when `on:click={bla}` and `bla === null`
	value && addEventListener(node, localName, ownedEvent(value))
