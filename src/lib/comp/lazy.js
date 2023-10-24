import { markComponent } from '#comp'
import { create } from '#renderer'

/**
 * Returns a `Component` that has been lazy loaded
 *
 * @param {Function} component - Import statement
 * @returns {() => pota.Component}
 */
export function lazy(component) {
	return markComponent(() =>
		component()
			.then(r => r && create(r.default))
			.catch(console.error),
	)
}
