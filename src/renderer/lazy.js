import { withOwner } from '../lib/reactivity/primitives/solid.js'
import { markComponent } from '../lib/comp/markComponent.js'

import { create } from './@renderer.js'

/**
 * Returns a `Component` that has been lazy loaded and can be used as
 * `Component(props)`
 *
 * @param {Function} component - Import statement
 * @returns {Component}
 */
export const lazy = component =>
	markComponent(props => {
		const owned = withOwner()
		// tries to load the lazy component
		const doTry = (tryAgain = true) =>
			component()
				.then(r => owned(() => create(r.default)(props)))
				.catch(e =>
					// trying again in case it fails due to some network error
					tryAgain
						? setTimeout(() => doTry(false), 5000)
						: console.error(e) || (() => component + ' is offline'),
				)

		return doTry()
	})
