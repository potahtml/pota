import { isArray } from '../../lib/std.js'
import {
	scrollToLocationHash,
	scrollToSelector,
	scrollToTop,
} from '../../use/scroll.js'
import { useRoute } from './context.js'

/**
 * Scroll to hash first, if doesnt, scroll to positions defined by the
 * Routes.
 *
 * @param {RouteContext} context
 */
export function scroll(context) {
	if (
		!scrollToLocationHash() &&
		!useRoute.walk(context => {
			if (context.scroll) {
				for (const item of isArray(context.scroll)
					? context.scroll
					: [context.scroll]) {
					if (scrollToSelector(item)) {
						return true
					}
				}
			}
		}, context)
	) {
		scrollToTop()
	}
}
