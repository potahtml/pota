import { scrollToLocationHash } from '../../lib/scroll/scrollToLocationHash.js'
import { scrollToSelector } from '../../lib/scroll/scrollToSelector.js'
import { scrollToTop } from '../../lib/scroll/scrollToTop.js'
import { walkParent } from '../../lib/std/walkParent.js'

export function scroll(context) {
	/**
	 * Scroll to hash first, if doesnt, scroll to positions defined by
	 * the Routes.
	 */
	if (!scrollToLocationHash()) {
		if (
			!walkParent(context, context => {
				if (context.scrolls) {
					for (const item of context.scrolls) {
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
