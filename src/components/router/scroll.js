import {
	scrollToLocationHash,
	scrollToSelector,
	scrollToTop,
} from '../../plugin/useScroll.js'

import { walkParents } from '../../lib/std.js'

export function scroll(context) {
	/**
	 * Scroll to hash first, if doesnt, scroll to positions defined by
	 * the Routes.
	 */
	if (!scrollToLocationHash()) {
		if (
			!walkParents(context, 'parent', context => {
				if (context.scroll) {
					for (const item of context.scroll) {
						if (scrollToSelector(item)) {
							return true
						}
					}
				}
			})
		) {
			scrollToTop()
		}
	}
}
