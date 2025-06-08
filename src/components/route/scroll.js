import { isArray } from '../../lib/std.js'
import {
	scrollToLocationHash,
	scrollToSelector,
	scrollToTop,
} from '../../plugin/useScroll.js'
import { RouteContext } from './context.js'

/**
 * Scroll to hash first, if doesnt, scroll to positions defined by the
 * Routes.
 * @param {RouteContextValue} context
 */
export function scroll(context) {
	if (
		!scrollToLocationHash() &&
		!RouteContext.walk(context => {
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
