import { markComponent, owned } from '../../lib/reactive.js'

import { useTimeout } from '../../use/time.js'

import { readyAsync } from '../../core/scheduler.js'

import { useRoute } from './context.js'
import { scroll } from './scroll.js'

/**
 * For dynamic imports. Used as `load(() => import('file.js'))`. It
 * retries a couple of times on network error. Scrolls the document to
 * the hash of the url, or fallbacks defined on the `<Route>`
 * components.
 *
 * @param {() => Promise<{ default: () => Children }>} component -
 *   Import statement
 * @returns {Component}
 * @url https://pota.quack.uy/load
 */
export function load(component, tries = 0) {
	return markComponent(() => {
		/**
		 * Owner is messed up because we are running the promise ourselves
		 * to be able to catch errors. Once pota supports error handling
		 * this wont be needed.
		 */
		let fn
		const withOwner = markComponent(owned(() => fn()))

		return component()
			.then(r => {
				fn = () => {
					readyAsync(() => scroll(useRoute()))
					return r.default()
				}
				return withOwner
			})
			.catch(
				e =>
					new Promise(resolve => {
						if (tries++ < 9) {
							fn = () => load(component, tries)
							useTimeout(() => resolve(withOwner), 5000).start()
						} else {
							resolve(e.toString())
						}
					}),
			)
	})
}
