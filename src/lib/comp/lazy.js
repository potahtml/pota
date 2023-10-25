import { markComponent } from './markComponent.js'
import { create } from '../../renderer/@main.js'

/**
 * Returns a `Component` that has been lazy loaded
 *
 * @param {Function} component - Import statement
 * @returns {() => Component}
 */
export function lazy(component) {
	return markComponent(() =>
		component()
			.then(r => r && create(r.default))
			.catch(console.error),
	)
}
