import { withOwner } from '../lib/reactivity/primitives/solid.js'
import { markComponent } from '../lib/comp/markComponent.js'

import { Component } from './@renderer.js'

/**
 * Returns a `Component` that has been lazy loaded and can be used as
 * `Component(props)`
 *
 * @param {Function} component - Import statement
 * @param {any} [fallback] - Fallback for in case the promise is
 *   rejected
 * @returns {Component}
 */
export const lazy = (component, fallback) =>
	markComponent(props => {
		const owned = withOwner()
		// tries to load the lazy component
		const doTry = (tryAgain = true) =>
			component()
				.then(r => owned(Component(r.default, props)))
				.catch(e =>
					// trying again in case it fails due to some network error
					tryAgain
						? new Promise(resolve =>
								setTimeout(() => resolve(doTry(false)), 5000),
							)
						: console.error(e) ||
							props?.fallback ||
							fallback ||
							(() => component + ' is offline'),
				)

		return doTry()
	})
