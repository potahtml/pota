import { scrollToHash, scrollToTop } from '#scroll'

export function scrollToHashWithFallback(hash) {
	if (!scrollToHash(hash)) scrollToTop()
}
