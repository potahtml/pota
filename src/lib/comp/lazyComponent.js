import { markComponent } from '#comp'

/**
 * Returns a `Component` that has been lazy loaded
 *
 * @param {string} path - Path to the module
 * @returns {Promise<unknown>}
 */
export function lazyComponent(path) {
	return import(path).then(r => r && markComponent(r.default))
}
