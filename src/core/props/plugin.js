import { cacheStore, toArray } from '../../lib/std.js'
import { onProps } from '../scheduler.js'

export const plugins = cacheStore()
export const pluginsNS = cacheStore()

/** @type {Set<string> & { xmlns?: string }} */
export const namespaces = new Set([
	'on',
	'prop',
	'class',
	'style',
	'use',
])

/**
 * Updates the xmlns string containing all registered namespaces Used
 * for XML serialization of components
 */
function updateNamespaces() {
	namespaces.xmlns = toArray(namespaces)
		.map(ns => `xmlns:${ns}="/"`)
		.join(' ')
}
updateNamespaces()

/**
 * Defines a prop that can be used on any Element
 *
 * @param {string} propName - Name of the prop
 * @param {(
 * 	node: Element,
 * 	propName: string,
 * 	propValue: Function | any,
 * 	props: object,
 * ) => void} fn
 *   - Function to run when this prop is found on any Element
 *
 * @param {boolean} [onMicrotask=true] - To avoid the problem of
 *   needed props not being set, or children elements not created yet.
 *   Default is `true`
 * @url https://pota.quack.uy/props/propsPlugin
 */
export const propsPlugin = (propName, fn, onMicrotask) => {
	plugin(plugins, propName, fn, onMicrotask)
}

/**
 * Defines a namespaced prop that can be used on any Element
 *
 * @param {string} NSName - Name of the namespace
 * @param {(
 * 	node: Element,
 * 	propName: string,
 * 	propValue: Function | any,
 * 	props: object,
 * 	localName: string,
 * 	ns: string,
 * ) => void} fn
 *   - Function to run when this prop is found on any Element
 *
 * @param {boolean} [onMicrotask=true] - Set to run on a microtask to
 *   avoid the problem of needed props not being set, or children
 *   elements not being created yet. Default is `true`
 */
export const propsPluginNS = (NSName, fn, onMicrotask) => {
	// update namespace for the `xml` function
	namespaces.add(NSName)
	updateNamespaces()
	plugin(pluginsNS, NSName, fn, onMicrotask)
}

/**
 * Internal helper to register a prop plugin in a plugin store
 *
 * @param {typeof plugins} plugins - Plugin store to register in
 * @param {string} name - Name of the plugin/prop
 * @param {Function} fn - Handler function to run when prop is found
 * @param {boolean} [onMicrotask=true] - Whether to run on microtask.
 *   Default is `true`
 */
const plugin = (plugins, name, fn, onMicrotask = true) => {
	plugins.set(
		name,
		!onMicrotask ? fn : (...args) => onProps(() => fn(...args)),
	)
}
