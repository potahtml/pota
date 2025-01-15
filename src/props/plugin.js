import { cacheStore } from '../lib/std.js'
import { onProps } from '../scheduler.js'

export const plugins = cacheStore()
export const pluginsNS = cacheStore()

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
	plugin(pluginsNS, NSName, fn, onMicrotask)
}

/**
 * Defines prop and namespaced prop that can be used on any Element
 *
 * @param {string} propName - Name of the prop/namespace
 * @param {Function} fn - Function to run when this prop is found on
 *   any Element
 * @param {boolean} [onMicrotask=true] - Set to run on a microtask to
 *   avoid the problem of needed props not being set, or children
 *   elements not being created yet. Default is `true`
 */
export const propsPluginBoth = (propName, fn, onMicrotask) => {
	plugin(plugins, propName, fn, onMicrotask)
	plugin(pluginsNS, propName, fn, onMicrotask)
}

const plugin = (plugins, name, fn, onMicrotask = true) => {
	plugins.set(
		name,
		!onMicrotask ? fn : (...args) => onProps(() => fn(...args)),
	)
}
