import { scrollToHash, scrollToTop } from '#scroll'

/**
 * Scrolls to hash and in case isnt found it scrolls to the top
 *
 * @param {string} hash - Hash to scroll to
 */
export function scrollToHashWithFallback(hash) {
	if (!scrollToHash(hash)) scrollToTop()
}
